const { getSignActivity } = require("./functions/activity");
const { userLogin, getCourses } = require("./functions/user");

!async function () {
  getSignActivity()
  // userLogin('18317559426','miao7456mmmm958')
  // await getCourses('105868175', '1635238858672', 'ZaBOHcLa2qW%2BbRCZcZV59DYSBrYHJdnEQhZYPCt4G1t1zIj8AogzZjsXdlAI5sCYySSPudN%2BBabjELHxAlUPRdqDP%2F4kNvQuV2yAqWQEf8antk3vPCAMpFUqoUEv9AGDVWzv20Vkyc08l3oS3EWI6mFnOdmPd9b%2B6Iox2vcR6KA%3D0bfa31c4ea5951a2edcf8b970093d260')
}()