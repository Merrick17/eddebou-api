export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenExpiration: '15m',
    refreshTokenExpiration: '7d',
  },
  // ... other config
}); 