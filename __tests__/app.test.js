const request = require("supertest");
const app = require("../app.js");
const seed = require("../db/seeds/seed");
const data = require("../db/data/");
const db = require("../db/connection");

beforeEach(() => seed(data));
afterAll(() => db.end());

describe("/api", () => {
  describe("GET", () => {
    describe("STATUS 200", () => {
      test("should respond with a JSON file with all endpoints", () => {
        return request(app)
          .get("/api")
          .expect(200)
          .then(({ body }) => {
            expect(typeof body).toBe("object");
            expect(body).toEqual(
              expect.objectContaining({
                "GET /api": expect.any(Object),
                "GET /api/topics": expect.any(Object),
                "GET /api/articles": expect.any(Object),
                "GET /api/articles/:article_id": expect.any(Object),
                "GET /api/articles/:article_id/comments": expect.any(Object),
                "PATCH /api/articles/:article_id": expect.any(Object),
                "POST /api/articles/:article_id/comments": expect.any(Object),
                "GET /api/users": expect.any(Object),
                "DELETE /api/comments/:comment_id": expect.any(Object),
              })
            );
          });
      });
    });
  });
});
describe("/api/topics", () => {
  describe("GET", () => {
    describe("STATUS 200", () => {
      test("respond with 200", () => {
        return request(app).get("/api/topics").expect(200);
      });
      test("should respond with array of topics objects with slug and description properties", () => {
        return request(app)
          .get("/api/topics")
          .expect(200)
          .then(({ body: { topics } }) => {
            expect(topics).toHaveLength(3);
            topics.forEach((topic) => {
              expect(topic).toEqual(
                expect.objectContaining({
                  slug: expect.any(String),
                  description: expect.any(String),
                })
              );
            });
          });
      });
    });
    describe("STATUS 404", () => {
      test("should respond with Bad request when given an invalid endpoint", () => {
        return request(app)
          .get("/api/topiczz")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Path not found.");
          });
      });
    });
  });
  describe("POST", () => {
    describe("STATUS 201", () => {
      test("should responds with an object with a key of topic with a value of the new topic object added via the request", () => {
        return request(app)
          .post("/api/topics")
          .send({
            slug: "topic name here",
            description: "description of topic",
          })
          .expect(201)
          .then(({ body: { topic } }) => {
            expect(topic).toEqual(
              expect.objectContaining({
                slug: "topic name here",
                description: "description of topic",
              })
            );
          })
          .then(() => {
            return request(app)
              .get("/api/topics")
              .expect(200)
              .then(({ body: { topics } }) => {
                expect(topics).toHaveLength(4);
              });
          });
      });
    });
    describe("STATUS 400", () => {
      test("responds with missing required information if request body is missing slug", () => {
        return request(app)
          .post("/api/topics")
          .send({ description: "I'm not sending a slug, deal with it" })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Missing required information.");
          });
      });
      test("responds with msg topic already exists if slug already exists in table", () => {
        return request(app)
          .post("/api/topics")
          .send({ slug: "cats", description: "need more cat topics" })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Topic already exists.");
          });
      });
    });
  });
});

describe("/api/articles/:article_id", () => {
  describe("GET", () => {
    describe("STATUS 200", () => {
      test("should respond with an article object with properties: author, title, article_id, body,topic,created_at and votes", () => {
        const ARTICLE_ID = 1;
        return request(app)
          .get(`/api/articles/${ARTICLE_ID}`)
          .expect(200)
          .then(({ body: { article } }) => {
            expect(article).toEqual(
              expect.objectContaining({
                author: expect.any(String),
                title: expect.any(String),
                article_id: expect.any(Number),
                body: expect.any(String),
                topic: expect.any(String),
                created_at: expect.any(String),
                votes: expect.any(Number),
                comment_count: expect.any(Number),
              })
            );
            expect(article).toEqual({
              article_id: 1,
              title: "Living in the shadow of a great man",
              topic: "mitch",
              author: "butter_bridge",
              body: "I find this existence challenging",
              created_at: "2020-07-09T20:11:00.000Z",
              votes: 100,
              comment_count: 11,
            });
          });
      });
    });
    describe("STATUS 400", () => {
      test("should respond with Bad Request when given an invalid id (not a number)", () => {
        return request(app)
          .get("/api/articles/notAnID")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request.");
          });
      });
    });
    describe("STATUS 404", () => {
      test("should respond with not found if valid but non existent article currently", () => {
        return request(app)
          .get("/api/articles/999")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Article not found.");
          });
      });
    });
  });
  describe("PATCH", () => {
    describe("STATUS 200", () => {
      test("should respond with the article with updated vote count", () => {
        const voteUpdates = { inc_votes: -5 };
        return request(app)
          .patch("/api/articles/3")
          .send(voteUpdates)
          .expect(200)
          .then(({ body: { article } }) => {
            expect(article).toEqual({
              article_id: 3,
              title: "Eight pug gifs that remind me of mitch",
              topic: "mitch",
              author: "icellusedkars",
              body: "some gifs",
              created_at: "2020-11-03T09:12:00.000Z",
              votes: -5,
            });
          });
      });
    });
    describe("STATUS 400", () => {
      test("should respond with Bad Request when given an invalid id (not a number)", () => {
        const voteUpdates = { inc_votes: 5 };
        return request(app)
          .patch("/api/articles/notAnId")
          .send(voteUpdates)
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request.");
          });
      });
      test("should respond with bad request when given an empty object as body", () => {
        const voteUpdates = {};
        return request(app)
          .patch("/api/articles/3")
          .send(voteUpdates)
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("No updates requested.");
          });
      });
    });
  });
  describe("DELETE", () => {
    describe("STATUS 204", () => {
      test("deletes an article and sends no response", () => {
        return request(app)
          .delete("/api/articles/1")
          .expect(204)
          .then(() => {
            return request(app)
              .get("/api/articles")
              .expect(200)
              .then(({ body: { total_count } }) => {
                expect(total_count).toBe(11);
              });
          });
      });
    });
    describe("STATUS 400", () => {
      test("responds with bad request if article_id is not an int", () => {
        return request(app)
          .delete("/api/articles/not-an-int")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request.");
          });
      });
    });
    describe("STATUS 404", () => {
      test("responds with no article found' when article_id is valid but not in the db yet", () => {
        return request(app)
          .delete("/api/articles/5555")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Article not found.");
          });
      });
    });
  });
});

describe("/api/users", () => {
  describe("GET", () => {
    describe("STATUS 200", () => {
      test("should respond with an array of objects with property username", () => {
        return request(app)
          .get("/api/users")
          .expect(200)
          .then(({ body: { users } }) => {
            expect(users).toHaveLength(4);
            users.forEach((user) => {
              expect(user).toEqual(
                expect.objectContaining({
                  username: expect.any(String),
                })
              );
            });
            expect(users).toEqual([
              { username: "butter_bridge" },
              { username: "icellusedkars" },
              { username: "rogersop" },
              { username: "lurker" },
            ]);
          });
      });
    });
  });
});

describe("/api/users/:username", () => {
  describe("GET", () => {
    describe("Status 200", () => {
      test("should respond with a user object with properties: username, avatar_url and name", () => {
        return request(app)
          .get("/api/users/butter_bridge")
          .expect(200)
          .then(({ body: { user } }) => {
            expect(user).toEqual(
              expect.objectContaining({
                username: "butter_bridge",
                avatar_url: expect.any(String),
                name: expect.any(String),
              })
            );
          });
      });
    });
    describe("STATUS 404", () => {
      test("responds with msg 'No user matching requested username' when username is valid but there isn't a user with that username currently in the database", () => {
        return request(app)
          .get("/api/users/not-a-user")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("No user found.");
          });
      });
    });
  });
});

describe("/api/articles", () => {
  describe("GET", () => {
    describe("STATUS 200", () => {
      test("should respond with an array of article objects with author,title,article_id,topic,created_at and votes properties", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toHaveLength(10);
            articles.forEach((article) => {
              expect(article).toEqual(
                expect.objectContaining({
                  article_id: expect.any(Number),
                  author: expect.any(String),
                  title: expect.any(String),
                  topic: expect.any(String),
                  created_at: expect.any(String),
                  votes: expect.any(Number),
                })
              );
            });
            expect(articles).toBeSortedBy("created_at", { descending: true });
          });
      });
      test("return contains a total_count property", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(({ body: { total_count } }) => {
            expect(total_count).toBe(12);
          });
      });
      test("should also include comment_count as a property", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toHaveLength(10);
            articles.forEach((article) => {
              expect(article).toEqual(
                expect.objectContaining({
                  comment_count: expect.any(Number),
                })
              );
            });
          });
      });
      test("should respond with articles sorted by votes at client request ", () => {
        return request(app)
          .get("/api/articles?sort_by=votes")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toBeSortedBy("votes", { descending: true });
          });
      });
      test("should respond with articles in ascending order at client request", () => {
        return request(app)
          .get("/api/articles?sort_by=votes&order=asc")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toBeSortedBy("votes");
          });
      });
      test("should respond with articles of a given topic only", () => {
        return request(app)
          .get("/api/articles/?topic=mitch")
          .expect(200)
          .then(({ body: { articles } }) => {
            articles.forEach((article) => {
              expect(article.topic).toEqual("mitch");
            });
          });
      });
      test("should respond with an empty array when topic exists but there are no articles for that topic", () => {
        return request(app)
          .get("/api/articles/?topic=paper")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toHaveLength(0);
          });
      });
      test("should respond with 10 articles as default limit is set to 10", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toHaveLength(10);
          });
      });
      test("should be able to take limit by a query", () => {
        return request(app)
          .get("/api/articles?limit=2")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toHaveLength(2);
          });
      });
      test("should return all articles if limit is 0", () => {
        return request(app)
          .get("/api/articles?limit=0")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toHaveLength(12);
          });
      });
      test("should be able to take page as a query", () => {
        return request(app)
          .get("/api/articles?p=2")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toHaveLength(2);
          });
      });
    });
    describe("STATUS 400", () => {
      test("should respond with bad request if order is anything but asc or desc", () => {
        return request(app)
          .get("/api/articles?order=notAnOrder")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe(
              "Unable to order. Ordering by notASortBy is an invalid request."
            );
          });
      });
      test("should respond with bad request if sort_by is anything but title,topic,author,created_at,votes or comment count", () => {
        return request(app)
          .get("/api/articles?sort_by=notASortBy")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe(
              "Unable to sort. Sorting by notASortBy is an invalid request."
            );
          });
      });
      test("should respond with bad request' if limit query isn't a number", () => {
        return request(app)
          .get("/api/articles?limit=notANumber")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request.");
          });
      });
      test("should respond with bad request' if p query isn't a number", () => {
        return request(app)
          .get("/api/articles?p=notANumber")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request.");
          });
      });
      test("should respond with limit and p queries must be positive integers' if given negative integers", () => {
        return request(app)
          .get("/api/articles?limit=-5")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Limit and p must be positive integers.");
          })
          .then(() => {
            return request(app)
              .get("/api/articles?p=-5")
              .expect(400)
              .then(({ body: { msg } }) => {
                expect(msg).toBe("Limit and p must be positive integers.");
              });
          });
      });
      describe("STATUS 404", () => {
        test("should respond with topic not found if topic doesn't exist when requesting to see articles of that topic", () => {
          return request(app)
            .get("/api/articles?topic=notATopic")
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Topic not found.");
            });
        });
        test("should respond with reached end of articles. please lower your limit or p values when the given p results in no articles returned", () => {
          return request(app)
            .get("/api/articles?p=55")
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).toBe(
                "Reached end of articles. Please lower your limit or p values."
              );
            });
        });
      });
    });
    describe("POST", () => {
      describe("STATUS 201", () => {
        test("Status 201 - responds with an object with a key of article with a value of the new article object added via the request", () => {
          return request(app)
            .post("/api/articles")
            .send({
              author: "butter_bridge",
              title: "a normal title",
              body: "insightful information",
              topic: "cats",
            })
            .expect(201)
            .then(({ body: { article } }) => {
              expect(article).toEqual(
                expect.objectContaining({
                  created_at: expect.any(String),
                  author: "butter_bridge",
                  title: "a normal title",
                  body: "insightful information",
                  article_id: 13,
                  topic: "cats",
                  votes: 0,
                  comment_count: 0,
                })
              );
            })
            .then(() => {
              return request(app)
                .get("/api/articles")
                .expect(200)
                .then(({ body: { total_count } }) => {
                  expect(total_count).toBe(13);
                });
            });
        });
      });
      describe("STATUS 400", () => {
        test("responds with msg missing required information if request body does not contain all of the required properties", () => {
          return request(app)
            .post("/api/articles")
            .send({
              author: "butter_bridge",
              title: "I'm missing a topic ",
              body: "I'm a body",
            })
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Missing required information.");
            });
        });
        test("responds with msg bad request if request body contains author not present in registered users table", () => {
          return request(app)
            .post("/api/articles")
            .send({
              author: "not registered user",
              title: "a title",
              body: "a body",
              topic: "cats",
            })
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Bad request.");
            });
        });
        test("responds with msg bad request if request body contains topic not present in topics table", () => {
          return request(app)
            .post("/api/articles")
            .send({
              author: "butter_bridge",
              title: "a title",
              body: "a body",
              topic: "not registered topic",
            })
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Bad request.");
            });
        });
      });
    });
  });

  describe("/api/articles/:article_id/comments", () => {
    describe("GET", () => {
      describe("STATUS 200", () => {
        test("should respond with an array of comments objects with comment_id, votes, created_at, author and body properties", () => {
          const ARTICLE_ID = 5;
          return request(app)
            .get(`/api/articles/${ARTICLE_ID}/comments`)
            .expect(200)
            .then(({ body: { comments } }) => {
              expect(comments).toHaveLength(2);
              comments.forEach((comment) => {
                expect(comment).toEqual(
                  expect.objectContaining({
                    comment_id: expect.any(Number),
                    votes: expect.any(Number),
                    created_at: expect.any(String),
                    author: expect.any(String),
                    body: expect.any(String),
                  })
                );
              });
            });
        });
        test("should respond with empty array if no comments for said article", () => {
          const ARTICLE_ID = 2;
          return request(app)
            .get(`/api/articles/${ARTICLE_ID}/comments`)
            .expect(200)
            .then(({ body: { comments } }) => {
              expect(comments).toHaveLength(0);
            });
        });
      });
      describe("STATUS 404", () => {
        test("should respond with not found if valid but non existent article currently", () => {
          return request(app)
            .get("/api/articles/999/comments")
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Article not found.");
            });
        });
      });
      describe("STATUS 400", () => {
        test("should respond with Bad Request when given an invalid id (not a number)", () => {
          return request(app)
            .get("/api/articles/notAnID/comments")
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Bad request.");
            });
        });
      });
    });
    describe("POST", () => {
      describe("STATUS 201", () => {
        test("should accept request body and respond with the posted comment object with username and body properties", () => {
          const ARTICLE_ID = 5;
          return request(app)
            .post(`/api/articles/${ARTICLE_ID}/comments`)
            .send({ username: "icellusedkars", body: "just a test" })
            .expect(201)
            .then(({ body: { comment } }) => {
              expect(comment).toEqual(
                expect.objectContaining({
                  comment_id: 19,
                  author: "icellusedkars",
                  body: "just a test",
                  votes: 0,
                  article_id: 5,
                  created_at: expect.any(String),
                })
              );
            });
        });
      });
      describe("STATUS 400", () => {
        test("should respond with bad request if given a string for article id", () => {
          const ARTICLE_ID = "notanId";
          return request(app)
            .post(`/api/articles/${ARTICLE_ID}/comments`)
            .send({ username: "icellusedkars", body: "just a test" })
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Bad request.");
            });
        });
        test("should respond with bad request if given an empty object)", () => {
          const ARTICLE_ID = 5;
          return request(app)
            .post(`/api/articles/${ARTICLE_ID}/comments`)
            .send({})
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("No comment submitted.");
            });
        });
      });
      describe("STATUS 404", () => {
        test("should respond with not found if valid but non existent article currently", () => {
          const ARTICLE_ID = "555";
          return request(app)
            .post(`/api/articles/${ARTICLE_ID}/comments`)
            .send({ username: "icellusedkars", body: "just a test" })
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Article not found.");
            });
        });
      });
    });
  });

  describe("/api/comments/:comment_id", () => {
    describe("DELETE", () => {
      describe("STATUS 204", () => {
        test("should delete a comment", () => {
          return request(app).delete("/api/comments/1").expect(204);
        });
        test("should ensure comment is deleted", () => {
          const comment1 = {
            body: "Oh, I've got compassion running out of my nose, pal! I'm the Sultan of Sentiment!",
            votes: 16,
            author: "butter_bridge",
            article_id: 9,
            created_at: 1586179020000,
          };
          return request(app)
            .delete("/api/comments/1")
            .expect(204)
            .then(async () => {
              const { rows } = await db.query("SELECT * FROM comments;");
              expect(rows.length).toBe(17);
              expect(rows[0].comment_id).not.toBe("1");
              expect(rows[0]).not.toEqual(comment1);
            });
        });
      });
      describe("STATUS 400", () => {
        test("should respond with bad request if comment Id is invalid", () => {
          return request(app)
            .delete("/api/comments/NotAnId")
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Bad request.");
            });
        });
      });
      describe("STATUS 404", () => {
        test("should respond with not found if valid but non existent article currently", () => {
          return request(app)
            .delete("/api/comments/999")
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Comment not found.");
            });
        });
      });
    });
    describe("PATCH", () => {
      describe("STATUS 200", () => {
        test("responds with an updated comment object with votes incremented by inc_votes integer", () => {
          return request(app)
            .patch("/api/comments/1")
            .send({ inc_votes: 5 })
            .expect(200)
            .then(({ body: { comment } }) => {
              expect(comment).toEqual(
                expect.objectContaining({
                  created_at: expect.any(String),
                  body: "Oh, I've got compassion running out of my nose, pal! I'm the Sultan of Sentiment!",
                  comment_id: 1,
                  article_id: 9,
                  author: "butter_bridge",
                  votes: 21,
                })
              );
            });
        });
        test("decrements votes if inc_votes is a negative integer", () => {
          return request(app)
            .patch("/api/comments/1")
            .send({ inc_votes: -5 })
            .expect(200)
            .then(({ body: { comment } }) => {
              expect(comment.votes).toBe(11);
            });
        });
      });
      describe("STATUS 400", () => {
        test("should respond with bad request when given an empty object as body", () => {
          return request(app)
            .patch("/api/comments/1")
            .send({})
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("No updates requested.");
            });
        });
        test("responds with msg bad request if request body contains inc_votes with an invalid value", () => {
          return request(app)
            .patch("/api/comments/1")
            .send({ inc_votes: "not-a-number" })
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Bad request.");
            });
        });
        test("responds with bad request if requested comment_id isn't an integer", () => {
          return request(app)
            .patch("/api/comments/not-an-int")
            .send({ inc_votes: 1 })
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Bad request.");
            });
        });
      });
      describe("STATUS 404", () => {
        test("responds with msg comment not found when comment_id is valid but there isn't a comment with such id yet", () => {
          return request(app)
            .patch("/api/comments/5555")
            .send({ inc_votes: 1 })
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).toBe("Comment not found.");
            });
        });
      });
    });
  });
});
