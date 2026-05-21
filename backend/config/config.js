/** @type {import('sequelize').Options} */

// 自定义日志函数：带时间戳
const logWithTimestamp = (sql) => {
  const now = new Date();
  const timestamp = now.toLocaleString('zh-CN', { hour12: false });
  console.log(`[${timestamp}] ${sql}`);
};

module.exports = {
  development: {
    username: process.env.DEV_DB_USERNAME,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_NAME,
    host: process.env.DEV_DB_HOSTNAME,
    dialect: process.env.DEV_DB_DIALECT,
    logging: process.env.DEV_DB_LOGGING === 'true' ? logWithTimestamp : false,
  },
  test: {
    username: process.env.TEST_DB_USERNAME,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_NAME,
    host: process.env.TEST_DB_HOSTNAME,
    dialect: process.env.TEST_DB_DIALECT,
    logging: process.env.TEST_DB_LOGGING === 'true' ? logWithTimestamp : false,
  },
  production: {
    username: process.env.PROD_DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOSTNAME,
    dialect: process.env.PROD_DB_DIALECT,
    logging: process.env.PROD_DB_LOGGING === 'true' ? logWithTimestamp : false,
  },
};