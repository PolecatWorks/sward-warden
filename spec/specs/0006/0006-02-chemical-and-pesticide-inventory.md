# 0006-02 Chemical and Pesticide Inventory Specification

## Status
Complete

## Overview
This document outlines the requirements for maintaining an inventory of Plant Protection Products (PPPs), based on Feature 2 of PRD 0006.

## Requirements

1. **Inventory Management**
   - Provide a system to record and maintain an inventory of chemical products and pesticides.
   - Implement full BREAD (Browse, Read, Edit, Add, Delete) operations for the inventory items via API endpoints.
   - Support optional association with a specific farm (if no farm is selected, it belongs to the portfolio).

2. **Product Authorization Number (MAPP)**
   - Specifically track the MAPP number for every recorded product.

3. **Quantity Tracking**
   - Maintain visibility into currently available quantities of each product.
   - This data will be used to facilitate accurate event tracking when products are applied.
