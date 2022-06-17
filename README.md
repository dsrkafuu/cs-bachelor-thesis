# CS Bacholer Thesis

My thesis project for the Computer Science and Technology Bachelor's degree.

我的计算机科学与技术专业毕业设计学位论文。

Thesis: https://github.com/dsrkafuu/cs-bachelor-thesis/blob/main/_thesis.pdf

## License

Released under `Apache License 2.0`, for more information read the [LICENSE](https://github.com/dsrkafuu/cs-bachelor-thesis/blob/main/LICENSE).

**Copyright © 2021-2022 DSRKafuU**

## Deployment

### Direct

Make sure MongoDB is available and required envs are set in `.env`.

```bash
npm i -g pnpm pm2
pnpm run build
pm2 start pm2.config.js
```

### Docker

```bash
docker-compose up
```

This will create a docker container for each service and run the app in it.

## Environment Variables

If the env variable is optional, it will be set to the default value below.

```
DATABASE_URL=mongodb://localhost:27017/dsra  # (Required) database url
AUTH_HASH_SEED="dsra-example_seed"           # (Required) seed to enerate the auth hash hex for JWT
BODY_SIZE_LIMIT="10kb"                       # (Optional) limit the size of the body in API request
CONSOLE_LOGGER=""                            # (Optional) enable console logger (for serverless logs)
```
