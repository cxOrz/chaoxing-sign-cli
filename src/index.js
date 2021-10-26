const { getSignActivity } = require("./functions/activity");
const { userLogin, getCourses } = require("./functions/user");

!async function () {
  getSignActivity()
  // userLogin('***REMOVED***','***REMOVED***')
  // await getCourses('***REMOVED***', '1635238858672', 'ZaBOHcLa2qW%2BbRCZcZV59DYSBrYHJdnEQhZYPCt4G1t1zIj8AogzZjsXdlAI5sCYySSPudN%2BBabjELHxAlUPRdqDP%2F4kNvQuV2yAqWQEf8antk3vPCAMpFUqoUEv9AGDVWzv20Vkyc08l3oS3EWI6mFnOdmPd9b%2B6Iox2vcR6KA%3D0bfa31c4ea5951a2edcf8b970093d260')
}()