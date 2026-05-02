# PRD 0013: Administration and Support Console

## 1. Overview
As the application scales to support multiple users and farms, an Administration and Support Console is required. This tool will allow system administrators and support staff to manage users, troubleshoot issues, and oversee the platform's data. To ensure security and separation of concerns, this console will be a separate application or interface from the main user-facing product, with distinct access controls and permissions.

## 2. Objectives
- Provide a dedicated interface for administrative and support tasks.
- Enable support staff to view and manage core entities (Users, Farms, Fields, Events, Farm Records) without requiring direct database access.
- Implement strict access controls to ensure only authorized personnel can access the administration tools.

## 3. Scope
The Administration Console will focus on providing read and limited write capabilities for the primary data entities established in the system architecture.

### 3.1 Separate Interface
- The admin console will not be bundled with the standard user application.
- It will be deployed and accessed independently (e.g., via a dedicated sub-domain or a completely separate fe container).

### 3.2 Access Control and Permissions
- The console will require distinct administrative or support-level permissions.
- Authentication will utilize the existing infrastructure but will enforce specific roles (e.g., `Admin`, `Support`).

## 4. Key Features

### 4.1 User Management
- View a list of all registered users.
- Search for users by name or email.
- View user details, including their associated farms.
- (Future) Ability to suspend or deactivate user accounts.

### 4.2 Support and Troubleshooting Views
Support staff require the ability to view data as it relates to a specific user to assist with troubleshooting.

- **Farms:** View all farms associated with a specific user, including the farm name and location.
- **Fields:** View all fields belonging to a farm, including the name and area in hectares.
- **Events:** View spreading events or other activities recorded for specific fields to help verify records or debug user issues.
- **Farm Records:** View high-level farm records (agricultural area, manure storage capacity, year) for compliance troubleshooting.

### 4.3 Data Consistency and Read-Only Access
- Initially, the primary function of the support views will be read-only to prevent accidental data corruption by support staff.
- Write access (e.g., editing a farm's details on behalf of a user) should be heavily restricted or deferred to a later phase.

## 5. Security Considerations
- The admin interface must be heavily protected, potentially restricted by IP address or VPN access, in addition to strong authentication.
- All actions taken within the admin console should be audited and logged.
