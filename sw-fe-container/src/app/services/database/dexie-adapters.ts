import { Table, liveQuery } from 'dexie';
import { Observable, from } from 'rxjs';

/**
 * Creates an RxJS Observable from a Dexie liveQuery function.
 */
export function fromLiveQuery<T>(querier: () => Promise<T> | T): Observable<T> {
  return from(liveQuery(querier));
}

/**
 * Compatible document wrapper with .toJSON() and .patch()
 */
export type DexieDoc<T> = T & {
  toJSON(): T;
  toMutableJSON(): T;
  patch(patchData: Partial<T>): Promise<DexieDoc<T>>;
  incrementalPatch(patchData: Partial<T>): Promise<DexieDoc<T>>;
  remove(): Promise<void>;
};

function wrapDocument<T extends object, Key = string>(table: Table<T, Key>, data: T): DexieDoc<T> {
  const clone = { ...data } as any;

  Object.defineProperty(clone, 'toJSON', {
    enumerable: false,
    value: function () {
      const res = { ...this };
      delete res.toJSON;
      delete res.toMutableJSON;
      delete res.patch;
      delete res.remove;
      return res;
    },
  });

  Object.defineProperty(clone, 'toMutableJSON', {
    enumerable: false,
    value: function () {
      return (this as any).toJSON();
    },
  });

  Object.defineProperty(clone, 'patch', {
    enumerable: false,
    value: async function (patchData: Partial<T>) {
      const primaryKey = this['id'] ?? this['key'];
      Object.assign(this, patchData);
      await table.update(primaryKey, patchData as any);
      return this;
    },
  });

  Object.defineProperty(clone, 'incrementalPatch', {
    enumerable: false,
    value: async function (patchData: Partial<T>) {
      return (this as any).patch(patchData);
    },
  });

  Object.defineProperty(clone, 'remove', {
    enumerable: false,
    value: async function () {
      const primaryKey = this['id'] ?? this['key'];
      await table.delete(primaryKey);
    },
  });

  return clone as DexieDoc<T>;
}

/**
 * Compatible query interface enabling smooth migration from RxDB collection queries to Dexie.
 */
export class DexieCollectionAdapter<T extends object, Key = string> {
  constructor(public readonly table: Table<T, Key>) {}

  find(query?: { selector?: Record<string, any>; sort?: any[] }): {
    $: Observable<DexieDoc<T>[]>;
    exec(): Promise<DexieDoc<T>[]>;
    remove(): Promise<void>;
  } {
    const filterFn = (item: T): boolean => {
      if (!query || !query.selector) return true;
      for (const [key, val] of Object.entries(query.selector)) {
        if (val && typeof val === 'object' && '$in' in val) {
          if (!val.$in.includes((item as any)[key])) return false;
        } else {
          if ((item as any)[key] !== val) return false;
        }
      }
      return true;
    };

    const getItems = async (): Promise<DexieDoc<T>[]> => {
      let items = await this.table.toArray();
      let filtered = items.filter(filterFn);
      if (query && query.sort && query.sort.length > 0) {
        const sortDef = query.sort[0];
        const [sortKey, sortDir] = Object.entries(sortDef)[0];
        filtered = filtered.sort((a, b) => {
          const valA = (a as any)[sortKey];
          const valB = (b as any)[sortKey];
          if (valA < valB) return sortDir === 'desc' ? 1 : -1;
          if (valA > valB) return sortDir === 'desc' ? -1 : 1;
          return 0;
        });
      }
      return filtered.map((item) => wrapDocument<T, Key>(this.table, item));
    };

    return {
      $: fromLiveQuery(getItems),
      exec: getItems,
      remove: async () => {
        const items = await getItems();
        const keys = items.map((i) => ((i as any).id ?? (i as any).key) as Key);
        if (keys.length > 0) {
          await this.table.bulkDelete(keys);
        }
      },
    };
  }

  findOne(query?: string | { selector?: Record<string, any> }): {
    $: Observable<DexieDoc<T> | null>;
    exec(): Promise<DexieDoc<T> | null>;
  } {
    const getDoc = async (): Promise<DexieDoc<T> | null> => {
      let item: T | undefined;
      if (typeof query === 'string') {
        item = await this.table.get(query as any);
      } else if (query && query.selector) {
        const selector = query.selector;
        if (selector['id'] && typeof selector['id'] === 'string' && Object.keys(selector).length === 1) {
          item = await this.table.get(selector['id'] as any);
        } else if (selector['key'] && typeof selector['key'] === 'string' && Object.keys(selector).length === 1) {
          item = await this.table.get(selector['key'] as any);
        } else {
          item = await this.table.filter((i) => {
            for (const [k, v] of Object.entries(selector)) {
              if ((i as any)[k] !== v) return false;
            }
            return true;
          }).first();
        }
      } else {
        item = await this.table.toCollection().first();
      }

      return item ? wrapDocument<T, Key>(this.table, item) : null;
    };

    return {
      $: fromLiveQuery(getDoc),
      exec: getDoc,
    };
  }

  async insert(doc: T): Promise<DexieDoc<T>> {
    await this.table.add(doc);
    return wrapDocument<T, Key>(this.table, doc);
  }

  async upsert(doc: T): Promise<DexieDoc<T>> {
    await this.table.put(doc);
    return wrapDocument<T, Key>(this.table, doc);
  }

  async bulkUpsert(docs: T[]): Promise<void> {
    if (docs.length > 0) {
      await this.table.bulkPut(docs);
    }
  }

  async bulkRemove(keys: Key[]): Promise<void> {
    if (keys.length > 0) {
      await this.table.bulkDelete(keys);
    }
  }
}
