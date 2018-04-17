exports.getOneOffSocialPost = async (req, res) => {

  return res.render('admin/oneOffSocialPost', {
    title : 'Create Social Post'
  });

};

exports.getCreateSocialPost = async (req, res) => {

  // const socialposts = await SocialPost.find({}).populate('upload');

  const socialposts = await SocialPost.find({}).populate({path: 'upload', populate: {path: 'uploader'}});

  return res.render('admin/createSocialPost', {
    title : 'Create Social Post',
    socialposts
  });

};
