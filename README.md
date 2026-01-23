# Testify

The platform serves as an all-in-one solution for sharing, discovering, and engaging with personal testimonies. Whether users want to tell their stories, explore testimonies from others, or interact through comments and reactions, the platform provides a seamless and intuitive experience. It is designed to make storytelling meaningful and accessible, ensuring a convenient and impactful space for users to express and connect through real-life experiences.

- https://google.com

---

## Requirements

For development, you will only need Node.js (version 20 and above) and a node global package installed in your environment.

### Node

- #### Node installation on Windows

    Just go on [official Node.js website](https://nodejs.org/) and download the installer.
    Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).


## Application Project Installation

  $ git clone https://github.com/enyata/koins-backend.git
  $ cd klickcash-backend-core
  $ npm install

---

## Configure app

create a  `.env` file to the root folder then add url to your db to connect your postgres DBs. 
An example of the structure of the `.env` is seen in `.env.example` file.

---

## Running migrations

    $ npm run migrate:create {migrationName} (to add new migration files)
    $ npm run migrate:up (to run up migrations)
    $ npm run migrate:down (to run down migrations)
    $ npm run seed:create {seedName} (to add new seed files)
    $ npm run seed:up (to run up seed)
    $ npm run seed:down (to run down seed)

---

## Project Structure
The folder structure of this app is explained below:

| Name | Description |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **migrations**           | Contains the migration files  |
| **node_modules**         | Contains all  npm dependencies     |
|     **modules**              | Contains modules for the application |
|     **config**           | Contains application configurations including environment-specific configurations 
|     **shared**              | Contains shared directories used by various modules across the applications.|
|     **routes**         | Contains routes for all modules, and also route versioning |
| **index.ts**             | Entry point to express app      |
| **tests**                | Contains all integration and unit test codes                         |
| **eslintrc.json**        | Config settings for eslint code style checking    |
| **database.json**        | Contains databases url            |
| **package.json**         | Contains npm dependencies as well as build scripts  |  
| **README.md**            | Contains details on how to setup the project locally and the codebase overview  | 
| **.babelrc**             | Contains the config for Babel preset | 
| **.env.example**         | Contains keys of the necessary environment variables needed in the .env file  |
| **.gitignore**           | Contains files and folders that github should ignore when pushing code to github  |
| **.eslintignore**        | Contains files and folders that eslint should ignore when `npm run lint` is invoked  |
| **.nycrc**               | Contains configuration and settings for the nyc reporter format  |
| **.editorconfig**       | Contains settings to help text editors conform to the set rules for this project irrespective of editor rule |

---

## Running the scripts
All the different build steps are arranged via npm scripts.
Npm scripts basically allow us to call (and chain) terminal commands via npm.

| Npm Script                | Description                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `dev`                     | Runs build in the local development environment. Can be invoked with `npm run dev` |
| `test`                    | Runs tests using mocha. Can be invoked with `npm run test`  (not available yet)      |
| `start`                   | Runs build in the staging development environment. Can be invoked with `npm run start`                      |
| `migrate:create`          | Runs when new migration files are needed. Can be invoked with `npm run migrate:create`             |
| `migrate:up`              | Runs when the added migration file needs to be implemented in the DB. Can be invoked with `npm run migrate:up`        |
| `migrate:down`            | Runs when the added migration file needs to be removed a step down in the DB. Can be invoked with `npm run migrate:down` |
| `seed:create`          | Creates new seed files. Can be invoked with `npm run seed:create`             |
| `seed:up`              | Runs when the added seed file needs to be seeded into the DB. Can be invoked with `npm run seed:up`        |
| `seed:down`            | Runs when the added seed file needs to be removed from the DB. Can be invoked with `npm run seed:down` |

---
## Postman API Documentation
https://crimson-trinity-34852.postman.co/workspace/My-Workspace~7da9c96c-5051-443b-82fc-f969e4f2e13f/collection/32963958-845c61c5-c18a-41c7-b825-a4d6224941c4?action=share&creator=32963958&active-environment=32963958-f27bfb81-540a-4f07-afcf-a97cc6f28342
___

## Technologies

- NodeJS
- ExpressJS
- TypeScript
- Postman
- PostgreSQL
- Redis
- Amazon Web Services (AWS)

---

## Copyright

Copyright (c) 2024

---
