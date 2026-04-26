//! Module to handle easy sending functions to tokio
//!
//! The provides two functions one function run_in_tokio creates and sends the function to tokio.
//! The second function run_in_tokio_with_cancel allows the creation of a CancellationToken which can be used to shut down the tokio async.

use crate::error::AppError;
use futures::Future;
use tracing::{error, info};

use serde::Deserialize;
use tokio::runtime::{self, Runtime};
use tokio_util::sync::CancellationToken;

#[derive(Deserialize, Debug, Clone)]
pub struct ThreadRuntime {
    pub threads: usize,
    pub stack_size: usize,
    pub name: String,
}

impl Default for ThreadRuntime {
    fn default() -> Self {
        ThreadRuntime {
            threads: 0,
            stack_size: 3_000_000,
            name: "default".into(),
        }
    }
}

pub fn rt_multithreaded(runtime: &ThreadRuntime) -> Result<Runtime, AppError> {
    if runtime.threads == 0 {
        runtime::Builder::new_current_thread()
            .enable_io()
            .enable_time()
            .build()
            .map_err(AppError::from)
    } else {
        runtime::Builder::new_multi_thread()
            .worker_threads(runtime.threads)
            .thread_name(runtime.name.clone())
            .thread_stack_size(runtime.stack_size)
            .enable_io()
            .enable_time()
            .build()
            .map_err(AppError::from)
    }
}

/// run async function inside tokio instance on current thread
pub fn run_in_tokio<F, T>(runtime: &ThreadRuntime, my_function: F) -> F::Output
where
    F: Future<Output = Result<T, AppError>>,
{
    info!("Starting Tokio: {}", runtime.name);

    rt_multithreaded(runtime)?
        // .expect("Runtime created")
        .block_on(my_function)
}

/// Run async with cancellability via CancellationToken
pub fn run_in_tokio_with_cancel<F, T>(
    runtime: &ThreadRuntime,
    cancel: CancellationToken,
    my_function: F,
) -> F::Output
where
    F: Future<Output = Result<T, AppError>>,
{
    run_in_tokio(runtime, async {
        tokio::select! {
            _ = cancel.cancelled() => {
                error!("Token cancelled");
                Err(AppError::Cancelled)
            },
            z = my_function => {
                eprintln!("Completed function");
                z
            },
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    use tokio::time::sleep;

    #[test]
    fn test_rt_multithreaded_current_thread() {
        let runtime = ThreadRuntime {
            threads: 0,
            stack_size: 2_000_000,
            name: "test-current".into(),
        };
        let rt = rt_multithreaded(&runtime).expect("Failed to build current thread runtime");
        let result = rt.block_on(async { 42 });
        assert_eq!(result, 42);
    }

    #[test]
    fn test_rt_multithreaded_multi_thread() {
        let runtime = ThreadRuntime {
            threads: 2,
            stack_size: 2_000_000,
            name: "test-multi".into(),
        };
        let rt = rt_multithreaded(&runtime).expect("Failed to build multi-thread runtime");
        let result = rt.block_on(async { 42 });
        assert_eq!(result, 42);
    }

    #[test]
    fn test_run_in_tokio_success() {
        let runtime = ThreadRuntime::default();
        let result = run_in_tokio(&runtime, async { Ok::<i32, AppError>(100) });
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 100);
    }

    #[test]
    fn test_run_in_tokio_with_cancel_success() {
        let runtime = ThreadRuntime::default();
        let cancel = CancellationToken::new();

        let result = run_in_tokio_with_cancel(&runtime, cancel, async { Ok::<i32, AppError>(200) });

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 200);
    }

    #[test]
    fn test_run_in_tokio_with_cancel_cancelled() {
        let runtime = ThreadRuntime::default();
        let cancel = CancellationToken::new();
        let cancel_clone = cancel.clone();

        let result = run_in_tokio_with_cancel(&runtime, cancel, async move {
            cancel_clone.cancel();
            sleep(Duration::from_millis(50)).await;
            Ok::<i32, AppError>(300)
        });

        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::Cancelled => (), // Expected
            _ => panic!("Expected AppError::Cancelled"),
        }
    }
}
