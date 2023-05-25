import { red } from 'kolorist';
import prompts from 'prompts';

export const PromptsOptions = {
  onCancel: () => {
    console.log(red('✖') + ' 操作取消');
    process.exit(0);
  },
};

// 最多保存10个位置，签到失败则轮流尝试
export const addressPrompts = async () => {
  const presetAddress = [];
  for (let i = 0; i < 10; i++) {
    let { lon_lat_address } = await prompts({
      type: 'text',
      name: 'lon_lat_address',
      message: `位置参数预设#${i + 1}（经纬度/地址）`,
      initial: '113.516288,34.817038/河南省郑州市万科城大学软件楼',
    }, PromptsOptions);
    lon_lat_address = lon_lat_address.match(/([\d.]*),([\d.]*)\/(\S*)/);
    console.log(`#${i + 1}  经度: ${lon_lat_address?.[1]}  纬度: ${lon_lat_address?.[2]}  地址: ${lon_lat_address?.[3]}`);
    presetAddress.push({
      lon: lon_lat_address?.[1],
      lat: lon_lat_address?.[2],
      address: lon_lat_address?.[3]
    });
    // 到10个就不再询问继续
    if (i < 9) {
      const { next } = await prompts({
        type: () => i === 9 ? null : 'confirm',
        name: 'next',
        message: '是否继续添加',
        initial: true,
      }, PromptsOptions);
      if (!next) break;
    }
  }
  return presetAddress;
};

/**
 * 监听模式问题数组
 */
export const monitorPromptsQuestions: Array<prompts.PromptObject> = [
  {
    type: 'number',
    name: 'delay',
    message: '签到延时（单位：秒）',
    initial: 0,
  },
  {
    type: 'confirm',
    name: 'mail',
    message: '是否启用邮件通知?',
    initial: false,
  },
  {
    type: (prev) => (prev ? 'text' : null),
    name: 'host',
    message: 'SMTP服务器',
    initial: 'smtp.qq.com',
  },
  {
    type: (prev) => (prev ? 'confirm' : null),
    name: 'ssl',
    message: '是否启用SSL',
    initial: true,
  },
  {
    type: (prev) => (prev ? 'number' : null),
    name: 'port',
    message: '端口号',
    initial: 465,
  },
  {
    type: (prev) => (prev ? 'text' : null),
    name: 'user',
    message: '邮件账号',
    initial: 'xxxxxxxxx@qq.com',
  },
  {
    type: (prev) => (prev ? 'text' : null),
    name: 'pass',
    message: '授权码(密码)',
  },
  {
    type: (prev) => (prev ? 'text' : null),
    name: 'to',
    message: '接收邮箱',
  },
  {
    type: 'confirm',
    name: 'cq_enabled',
    message: '是否连接到go-cqhttp服务?',
    initial: false,
  },
  {
    type: (prev) => (prev ? 'text' : null),
    name: 'ws_url',
    message: 'Websocket 地址',
    initial: 'ws://127.0.0.1:8080',
  },
  {
    type: (prev) => (prev ? 'select' : null),
    name: 'target_type',
    message: '选择消息的推送目标',
    choices: [
      { title: '群组', value: 'group' },
      { title: '私聊', value: 'private' }
    ],
  },
  {
    type: (prev) => (prev ? 'number' : null),
    name: 'target_id',
    message: '接收号码',
    initial: 10001,
  },
];

