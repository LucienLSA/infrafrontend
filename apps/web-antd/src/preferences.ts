import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: 'AIDOC',
  },
  logo: {
    enable: true,
    fit: 'contain',
    // 如果您的项目中有logo文件，请将其放在 public 目录下，然后使用 '/logo.png' 这样的路径
    // 如果暂时没有logo文件，可以设置为空字符串，这样只会显示文字"AIDOC"
    source: '', // 设置为空字符串，只显示文字；或者使用在线URL，例如：'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp'
  },
});
