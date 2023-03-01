export const LOGIN_PAGE = {
  URL: 'http://passport2.chaoxing.com/mlogin?fid=&newversion=true&refer=http%3A%2F%2Fi.chaoxing.com',
  METHOD: 'GET'
};
export const LOGIN = {
  URL: 'http://passport2.chaoxing.com/fanyalogin',
  METHOD: 'POST',
};
export const PRESIGN = {
  URL: 'https://mobilelearn.chaoxing.com/newsign/preSign',
  METHOD: 'GET'
};
export const PPTSIGN = {
  URL: 'https://mobilelearn.chaoxing.com/pptSign/stuSignajax',
  METHOD: 'GET'
};
export const PPTACTIVEINFO = {
  URL: 'https://mobilelearn.chaoxing.com/v2/apis/active/getPPTActiveInfo',
  METHOD: 'GET'
};
export const COURSELIST = {
  URL: 'http://mooc1-1.chaoxing.com/visit/courselistdata',
  METHOD: 'POST'
};
export const BACKCLAZZDATA = {
  URL: 'http://mooc1-api.chaoxing.com/mycourse/backclazzdata',
  METHOD: 'GET'
};
export const ACTIVELIST = {
  URL: 'https://mobilelearn.chaoxing.com/v2/apis/active/student/activelist',
  METHOD: 'GET'
};
export const ACCOUNTMANAGE = {
  URL: 'http://passport2.chaoxing.com/mooc/accountManage',
  METHOD: 'GET'
};
export const PANCHAOXING = {
  URL: 'https://pan-yz.chaoxing.com',
  METHOD: 'GET'
};
export const PANLIST = {
  URL: 'https://pan-yz.chaoxing.com/opt/listres',
  METHOD: 'POST'
};
export const PANTOKEN = {
  URL: 'https://pan-yz.chaoxing.com/api/token/uservalid',
  METHOD: 'GET'
};
export const PANUPLOAD = {
  URL: 'https://pan-yz.chaoxing.com/upload',
  METHOD: 'POST'
};
export const WEBIM = {
  URL: 'https://im.chaoxing.com/webim/me',
  METHOD: 'GET'
};

// 无课程的群聊的一些 API
export const CHAT_GROUP = {
  PRESTUSIGN: {
    URL: 'https://mobilelearn.chaoxing.com/sign/preStuSign',
    METHOD: 'GET'
  },
  SIGN: {
    URL: 'https://mobilelearn.chaoxing.com/sign/stuSignajax',
    // 也存在是 POST 的情况
    METHOD: 'GET'
  }
};