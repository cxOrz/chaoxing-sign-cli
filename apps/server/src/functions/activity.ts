import { ACTIVELIST, CHAT_GROUP, PPTACTIVEINFO, PRESIGN } from '../configs/api';
import { cookieSerialize, request } from '../utils/request';

/**
 * 返回一个签到信息对象 {activeId, name, courseId, classId, otherId}
 * @param {{courseId:string, classId:string}[]} courses
 */
export const traverseCourseActivity = async (args: BasicCookie & { courses: CourseType[]; }): Promise<string | Activity> => {
  console.log('正在查询有效签到活动，等待时间视网络情况而定...');
  const { courses, ...cookies } = args;
  let i = 0;
  let tasks: Promise<any>[] = [];

  // 特殊情况，只有一门课
  if (courses.length === 1) {
    try {
      i++;
      return await getActivity({ course: courses[0], ...cookies });
    } catch (err) {
      // 该课程无有效签到
    }
  }

  tasks.push(getActivity({ course: courses[0], ...cookies }));
  // 一次请求五个，全部reject或有一个成功则进行下一次请求
  for (i = 1; i < courses.length; i++) {
    // 课程请求加入任务数组
    tasks.push(getActivity({ course: courses[i], ...cookies }));
    // 一轮提交5个，若处于最后一个且此轮还不够5个，提交此轮全部
    if (i % 5 === 0 || i === courses.length - 1) {
      try {
        // 任务数组中任意一个成功就返回；否则，抛出异常
        return await Promise.any(tasks);
      } catch (error) { /* empty */ }
      // 每轮请求任务组之后，清空任务数组供下轮使用
      tasks = [];
    }
  }

  console.log('未检测到有效签到活动！');
  return 'NoActivity';
};

/**
 * @returns 签到信息对象
 */
export const getActivity = async (args: BasicCookie & { course: CourseType; }): Promise<string | Activity> => {
  const { course, ...cookies } = args;
  const result = await request(
    `${ACTIVELIST.URL}?fid=0&courseId=${course.courseId}&classId=${course.classId}&_=${new Date().getTime()}`,
    {
      secure: true,
      headers: {
        Cookie: cookieSerialize(cookies),
      },
    }
  );

  const data = JSON.parse(result.data);
  // 判断是否请求成功
  if (data.data !== null) {
    if (data.data.activeList.length !== 0) {
      const otherId = Number(data.data.activeList[0].otherId);
      // 判断是否有效签到活动
      if (otherId >= 0 && otherId <= 5 && data.data.activeList[0].status === 1) {
        // 活动开始超过一小时则忽略
        if ((new Date().getTime() - data.data.activeList[0].startTime) / 1000 < 7200) {
          console.log(`检测到活动：${data.data.activeList[0].nameOne}`);
          return {
            activeId: data.data.activeList[0].id,
            name: data.data.activeList[0].nameOne,
            courseId: course.courseId,
            classId: course.classId,
            otherId,
          };
        }
      }
    }
  } else {
    console.log('请求似乎有些频繁，获取数据为空!');
    return 'Too Frequent';
  }
  // 此课程最新活动并非有效签到
  throw 'Not Available';
};

/**
 * 根据 activeId 请求获得签到信息
 */
export const getPPTActiveInfo = async ({ activeId, ...cookies }: BasicCookie & { activeId: string; }) => {
  const result = await request(`${PPTACTIVEINFO.URL}?activeId=${activeId}`, {
    secure: true,
    headers: {
      Cookie: cookieSerialize(cookies),
    },
  });

  return JSON.parse(result.data).data;
};

// 预签到请求
export const preSign = async (args: BasicCookie & { activeId: string; courseId: string; classId: string; }) => {
  const { activeId, classId, courseId, ...cookies } = args;
  await request(
    `${PRESIGN.URL}?courseId=${courseId}&classId=${classId}&activePrimaryId=${activeId}&general=1&sys=1&ls=1&appType=15&&tid=&uid=${args._uid}&ut=s`,
    {
      secure: true,
      headers: {
        Cookie: cookieSerialize(cookies),
      },
    }
  );
  console.log('[预签]已请求');
};

export const preSign2 = async (args: BasicCookie & { activeId: string; chatId: string; _uid: string; tuid: string; }) => {
  const { activeId, chatId, tuid, ...cookies } = args;
  const result = await request(
    `${CHAT_GROUP.PRESTUSIGN.URL}?activeId=${activeId}&code=&uid=${cookies._uid}&courseId=null&classId=0&general=0&chatId=${chatId}&appType=0&tid=${tuid}&atype=null&sys=0`,
    {
      secure: true,
      headers: {
        Cookie: cookieSerialize(cookies),
      },
    }
  );
  console.log('[预签]已请求');
  return result.data;
};

/**
 * 推测签到类型
 */
export const speculateType = (text: string) => {
  if (text.includes('拍照')) {
    return 'photo';
  } else if (text.includes('位置')) {
    return 'location';
  } else if (text.includes('二维码')) {
    return 'qr';
  }
  // 普通、手势
  return 'general';
};

/**
 * 解析签到类型
 * @param iptPPTActiveInfo getPPTActiveInfo 的返回对象
 */
export const getSignType = (iptPPTActiveInfo: any) => {
  switch (iptPPTActiveInfo.otherId) {
    case 0:
      if (iptPPTActiveInfo.ifphoto === 1) { return '拍照签到'; } else { return '普通签到'; }
    case 2: return '二维码签到';
    case 3: return '手势签到';
    case 4: return '位置签到';
    case 5: return '签到码签到';
    default: return '未知';
  }
};

/**
 * 解析签到结果
 * @param iptResult 签到结果
 * @returns 返回具体的中文结果
 */
export const getSignResult = (iptResult: string) => {
  switch (iptResult) {
    case 'success': return '成功';
    case 'fail': return '失败';
    case 'fail-need-qrcode': return '请发送二维码';
    default: return iptResult;
  }
};