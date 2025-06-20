[//]: # (nest new project-name --directory path/to/subdirectory --skip-git)

### Setup Notes
1. To create a new NestJS project in a specific subdirectory without initializing a Git repository, you can use the following command:
    ```bash
    nest new project-name --directory path/to/subdirectory --skip-git
    ```
2. Add a `.gitignore` file in the root of your NestJS project
3.

#### Users Module
1. Create a `users` module:
    ```bash
    nest g module users
    ```
2. Create a `users` controller:
    ```bash
    nest g controller users
    ```
3. Create a `users` service:
    ```bash
    nest g service users
    ```
4. Create a `users` schema:
    ```bash
    nest g class users/schema/user.schema --no-spec
    ```
5. Create a `users` DTO (Data Transfer Object):
    ```bash
    nest g class users/dto/create-user.request.dto --no-spec
    ```
6. or generate all at once using resource command:
   ```bash
   nest g resource users --no-spec
   ```
   

### Authentication
1. Create an `auth` resource:
    ```bash
    nest g resource auth --no-spec
    ```
   

### Repositories
1. Create a `repositories` module:
    ```bash
    nest g module repositories
    ```

