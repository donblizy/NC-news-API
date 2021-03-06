const {
  selectComments,
  insertComment,
  deleteCommentByCommentId,
  updateCommentById,
} = require("../models/comments-models");
const { checkArticleExists } = require("../models/articles-models");

exports.getCommentsByArticleId = (req, res, next) => {
  const { article_id: articleId } = req.params;
  Promise.all([selectComments(articleId), checkArticleExists(articleId)])
    .then(([comments]) => {
      res.status(200).send({ comments });
    })
    .catch((err) => next(err));
};

exports.postCommentByArticleId = (req, res, next) => {
  const { article_id: articleId } = req.params;
  Promise.all([
    checkArticleExists(articleId),
    insertComment(req.body, articleId),
  ])
    .then(([, comment]) => {
      res.status(201).send({ comment });
    })
    .catch((err) => next(err));
};

exports.removeCommentByCommentId = (req, res, next) => {
  const { comment_id: commentId } = req.params;
  deleteCommentByCommentId(commentId)
    .then(() => res.sendStatus(204))
    .catch((err) => {
      next(err);
    });
};

exports.patchCommentById = (req, res, next) => {
  const { comment_id: commentId } = req.params;
  const { inc_votes: incVotes } = req.body;
  return updateCommentById(incVotes, commentId)
    .then((comment) => {
      return res.status(200).send({ comment });
    })
    .catch((err) => {
      next(err);
    });
};
