const { getCourses } = require("./user")
const https = require('https')
const { ACTIVELIST } = require("../configs/api")

exports.getSignActivity = async () => {
  let activities = await getCourses('***REMOVED***', '1635238858672', 'ZaBOHcLa2qW%2BbRCZcZV59DYSBrYHJdnEQhZYPCt4G1t1zIj8AogzZjsXdlAI5sCYySSPudN%2BBabjELHxAlUPRdqDP%2F4kNvQuV2yAqWQEf8antk3vPCAMpFUqoUEv9AGDVWzv20Vkyc08l3oS3EWI6mFnOdmPd9b%2B6Iox2vcR6KA%3D0bfa31c4ea5951a2edcf8b970093d260')
  for (let i = 0; i < activities.length; i++) {
    await new Promise((resolve) => {
      let data = ''
      https.get(ACTIVELIST.URL + `?fid=0&courseId=${activities[i].courseId}&classId=${activities[i].classId}&_=${new Date().getTime()}`, {
        headers: {
          'Cookie': `uf=da0883eb5260151e80d38b1efb44322ebabdbf75b0f7d5714a56677dac0c45ee3c6487c40645c19b1cb9a2c2335ffb1c913b662843f1f4ad6d92e371d7fdf64452e8f24c45b90390fd68be96b6183b1a06f6a395fbf381205762bac8faff29d029b2b962787c07fa; _d=1635238858672; UID=***REMOVED***; vc3=ZaBOHcLa2qW%2BbRCZcZV59DYSBrYHJdnEQhZYPCt4G1t1zIj8AogzZjsXdlAI5sCYySSPudN%2BBabjELHxAlUPRdqDP%2F4kNvQuV2yAqWQEf8antk3vPCAMpFUqoUEv9AGDVWzv20Vkyc08l3oS3EWI6mFnOdmPd9b%2B6Iox2vcR6KA%3D0bfa31c4ea5951a2edcf8b970093d260;`,
        }
      }, (res) => {
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          // console.log(data)
          data = JSON.parse(data)
          if (data.data.activeList[0].status == 1) {
            console.log(`检测到活动：${data.data.activeList[0].nameOne}`)
            // 传出签到活动 aid
            resolve(data.data.activeList[0].id)
            // 跳出循环
            i = 1000
          } else resolve()
        })
      })
    })
  }
}