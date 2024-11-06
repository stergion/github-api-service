[![TypeScript](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/stergion/github-api-service/main/package.json&query=$.devDependencies.typescript&label=TypeScript&color=blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/stergion/github-api-service/main/package.json&query=$.engines.node&label=Node.js&color=green)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/stergion/github-api-service/main/package.json&query=$.dependencies.express&label=Express&color=blue)](https://expressjs.com/)
[![Octokit](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/stergion/github-api-service/main/package.json&query=$.devDependencies.typescript&label=octokit&color=blue)](https://octokit.github.io/rest.js/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-brightgreen.svg)](https://swagger.io/)

# GitHub Contributions API

A simple REST API service that provides detailed GitHub user contribution data using Server-Sent Events (SSE) for real-time streaming.

## Features

- Stream user contributions (commits, issues, pull requests,  pull request reviews, comments)
- Real-time data streaming via SSE
- Swagger/OpenAPI documentation
- TypeScript with full type safety

## Installation
Download the repository with git clone:
```
git clone https://github.com/stergion/gihub-api-service.git
```
or curl
```
curl https://github.com/stergion/gihub-api-service.git
```

Navigate to the project directory
```
cd gihub-api-service
```

Install dependencies
```
npm install
```

## Configuration

Create a `.env` file:
```
GITHUB_TOKEN=your_github_personal_access_token
```

## Usage
Build the project:
```bash
npm run build
```

Start the server:
```bash
npm run start
```

The API will be available at `http://localhost:3000`

## API Documentation

Access the Swagger UI at `http://localhost:3000/api-docs`


