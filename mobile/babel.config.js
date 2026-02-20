module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blocklist: null,
          allowlist: null,
          safe: true,
          allowUndefined: false,
        },
      ],
      [
        "module-resolver",
        {
          "root": ['./'],
          "alias": {
            ":darywin-types": "../packages/darywin-types",
            ":darywin-helper": "../packages/darywin-helper",
            ":currency-converter": "../packages/currency-converter"
          }
        }
      ],
      'react-native-reanimated/plugin',
    ],
  }
}
