let alreadyReported;
// need to add the upload
let reportForSiteVisitor = await Report.findOne({ reportingSiteVisitor : req.siteVisitor, upload: upload._id  }).hint('Report For Site Visitor');
let reportForReportingUser = await Report.findOne({ reportingUser : req.user, upload: upload._id }).hint('Report For User');

if(reportForReportingUser || reportForSiteVisitor){
  alreadyReported = true;
} else {
  alreadyReported = false;
}
