DO NOT COMPILE

const { App } = require("@slack/bolt");
const store = require("./store");
const { Octokit } = require("@octokit/core");
const schedule = require('node-schedule');

const octokit = new Octokit();
const myParser = require("body-parser");

let app;

const placeToSendMessage = "#demo";

async function sendMessage(channelName, message) {
   try {
    const result = await app.client.chat.postMessage({
      channel: channelName,
      text: 'test',
      blocks: message
    });
  }
  catch (error) {
    console.log(error);
  }
};

const repos = [
  {
    owner: 'bktsim',
    repo: 'pr2'
  }
]


async function dailyReminders(repo) {
  const res = await octokit.request('GET /repos/{owner}/{repo}/pulls', repo);
  
  let message;
  
  console.log(res);
  
  if (res.data.length === 0) {
    message = [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `There are no active pull requests in the repo ${repo.repo}. Great Job! :partying_face:`
			}
		}
	]
  } else {
    const numOfPullRequests = res.data.length;
    
    message = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `There are ${numOfPullRequests} active pull requests in the repo ${repo.repo}`
        }
      }
    ]
    
    for (let pr of res.data) {
      let reviewers = [];
      for (let reviewer of pr.requested_reviewers) {
        if (reviewer.login.includes("-")) {
          reviewers.push(`<@${reviewer.login.replace("-", ".")}>`);
        } else {
          reviewers.push(`<@${reviewer.login}>`);
        }
      }
      
      message.push({"type": "divider"});
      message.push(
        {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `${pr.title}` + "\n" + `${pr.html_url}`
        }
      }
      )
      message.push({
			"type": "section",
			"fields": [
        {
					"type": "mrkdwn",
					"text": `*Repo:*\n*${repo.repo}*`
				},
				{
					"type": "mrkdwn",
					"text": `*Submitted by:*\n${pr.user.login}`
				},
				{
					"type": "mrkdwn",
					"text": `*When:*\n${new Date(pr.updated_at).toLocaleString("en-US", {timeZone: "America/Los_Angeles"}) + " PST"}`
				},
        {
          "type": "mrkdwn",
          "text": `*Reviewers:*\n ${reviewers.length === 0 ? "None" : reviewers.join(",")}`
        }
			]
		})
    }
  }
  
  sendMessage(placeToSendMessage, message);
}


const dailyReminder = schedule.scheduleJob('38 * * * 1-5', async function(){
  for (let repo of repos) {
    await dailyReminders(repo);
  }
});

const hourlyReminder = schedule.scheduleJob('11 * * 1-5', async function(){
  for (let repo of repos) {
    await dailyReminders(repo);
  }
});

const hourlyReminder2 = schedule.scheduleJob('13 * * 1-5', async function(){
  for (let repo of repos) {
    await dailyReminders(repo);
  }
});

const hourlyReminder3 = schedule.scheduleJob('15 * * 1-5', async function(){
  for (let repo of repos) {
    await dailyReminders(repo);
  }
});

// Pull request opened, closed, reopened, edited, assigned, unassigned, review requested, review request removed, labeled, unlabeled, synchronized, ready for review, converted to draft, locked, unlocked, auto merge enabled, auto merge disabled, milestoned, or demilestoned.
const pullsHandler = (req, res) => {
  console.log("PULLSHANDLER: ");
  let body = '';
  
  req.on('data', (chunk) => {
      body += chunk;
  });
  
  req.on('end', () => {
    body = JSON.parse(body);
    console.log(body);

    
    if (body.action === "review_requested") {
      const pullRequestBody  = body.pull_request;
      const pullRequestLink  = pullRequestBody.html_url;
      const pullRequestTitle = pullRequestBody.title;
      const pullRequestUser  = pullRequestBody.user.login;
      const pullRequestCreated   = pullRequestBody.created_at;
      const pullRequestReviewers = pullRequestBody.requested_reviewers;
      const repositoryLink = body.repository.html_url;
      const repositoryName = body.repository.name;
      const createdDate = pullRequestBody.created_at;
      
      // make reviewers into taggable format
      let reviewers = [];
      for (let reviewer of pullRequestReviewers) {
        if (reviewer.login.includes("-")) {
          reviewers.push(`<@${reviewer.login.replace("-", ".")}>`);
        } else {
          reviewers.push(`<@${reviewer.login}>`);
        }
      }
      
      const message = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*${pullRequestUser}* has requested review for a pull request: *<${pullRequestLink}|${pullRequestTitle}>*`
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Submitted by: ${pullRequestUser} `
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*Repo:*\n *<${repositoryLink}|${repositoryName}>*`
            },
            {
              "type": "mrkdwn",
              "text": `*When:*\nSubmitted ${new Date(createdDate).toLocaleString("en-US", {timeZone: "America/Los_Angeles"}) + " PST"}`
            },
            {
              "type": "mrkdwn",
              "text": `*Reviewers:*\n ${reviewers.length === 0 ? "None" : reviewers.join(",")}`
            },
            {
              "type": "mrkdwn",
              "text": `*Status:*\n ${body.pull_request.state === "approved" ? "✅ Approved" : "⏱️ In Progress"}`
            }
          ]
        }
      ];
      sendMessage(placeToSendMessage, message);
    } else if (body.action === "opened") {
      const pullRequestBody  = body.pull_request;
      const pullRequestLink  = pullRequestBody.html_url;
      const pullRequestTitle = pullRequestBody.title;
      const pullRequestUser  = pullRequestBody.user.login;
      const pullRequestCreated   = pullRequestBody.created_at;
      const pullRequestReviewers = pullRequestBody.requested_reviewers;
      const repositoryLink = body.repository.html_url;
      const repositoryName = body.repository.name;
      const createdDate = pullRequestBody.created_at;
      
      let reviewers = [];
      
      for (let reviewer of pullRequestReviewers) {
        if (reviewer.login.includes("-")) {
          reviewers.push(`${reviewer.login.replace("-", ".")}`);
        } else {
          reviewers.push(`${reviewer.login}`);
        }
      }
      
      const message = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*${pullRequestUser}* has opened a pull request: *<${pullRequestLink}|${pullRequestTitle}>*`
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Submitted by: ${pullRequestUser} `
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*Repo:*\n *<${repositoryLink}|${repositoryName}>*`
            },
            {
              "type": "mrkdwn",
              "text": `*When:*\n Submitted ${new Date(createdDate).toLocaleString("en-US", {timeZone: "America/Los_Angeles"}) + " PST"}`
            },
            {
              "type": "mrkdwn",
              "text": `*Reviewers:*\n ${reviewers.length === 0 ? "None" : reviewers.join(",")}`
            },
            {
              "type": "mrkdwn",
              "text": `*Status:*\n ${body.pull_request.state === "approved" ? "✅ Approved" : "⏱️ In Progress"}`
            }
          ]
        }
      ];
      sendMessage(placeToSendMessage, message);
    } else if (body.action === "closed") {
      const pullRequestBody  = body.pull_request;
      const pullRequestLink  = pullRequestBody.html_url;
      const pullRequestTitle = pullRequestBody.title;
      const pullRequestUser  = pullRequestBody.user.login;
      const pullRequestCreated   = pullRequestBody.created_at;
      const pullRequestReviewers = pullRequestBody.requested_reviewers;
      const repositoryLink = body.repository.html_url;
      const repositoryName = body.repository.name;
      const createdDate = pullRequestBody.created_at;
      let pullRequestClosedTime = pullRequestBody.closed_at;
      
      let reviewers = [];
      for (let reviewer of pullRequestReviewers) {
        if (reviewer.login.includes("-")) {
          reviewers.push(`${reviewer.login.replace("-", ".")}`);
        } else {
          reviewers.push(`${reviewer.login}`);
        }
      }
      
      const message = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*${pullRequestUser}*'s pull request has been closed: *<${pullRequestLink}|${pullRequestTitle}>*`
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Submitted by: ${pullRequestUser} `
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*Repo:*\n *<${repositoryLink}|${repositoryName}>*`
            },
            {
              "type": "mrkdwn",
              "text": `*When:*\nSubmitted ${new Date(createdDate).toLocaleString("en-US", {timeZone: "America/Los_Angeles"}) + " PST"}`
            },
            {
              "type": "mrkdwn",
              "text": `*Reviewers:*\n ${reviewers.length === 0 ? "None" : reviewers.join(",")}`
            },
            {
              "type": "mrkdwn",
              "text": `*Status:*\n ${body.pull_request.state === "closed" ? "🎉 Done" : "⏱️ In Progress"}`
            }
          ]
        }
      ];
      sendMessage(placeToSendMessage, message);
    } else if (body.action === "reopened") {
      const pullRequestBody  = body.pull_request;
      const pullRequestLink  = pullRequestBody.url;
      const pullRequestTitle = pullRequestBody.title;
      const pullRequestUser  = pullRequestBody.user.login;
      const pullRequestCreated   = pullRequestBody.created_at;
      const pullRequestReviewers = pullRequestBody.requested_reviewers;
      const repositoryLink = body.repository.html_url;
      const repositoryName = body.repository.name;
      const createdDate = pullRequestBody.created_at;
      const pullRequestReopenedTime = pullRequestBody.updated_at;

      // make reviewers into taggable format
      let reviewers = [];
      for (let reviewer of pullRequestReviewers) {
        if (reviewer.login.includes("-")) {
          reviewers.push(`<@${reviewer.login.replace("-", ".")}>`);
        } else {
          reviewers.push(`<@${reviewer.login}>`);
        }
      }
      
      const message = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*${pullRequestUser}* has reopened a pull request: *<${pullRequestLink}|${pullRequestTitle}>*`
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Submitted by: ${pullRequestUser} `
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*Repo:*\n *<${repositoryLink}|${repositoryName}>*`
            },
            {
              "type": "mrkdwn",
              "text": `*When:*\nSubmitted ${new Date(createdDate).toLocaleString("en-US", {timeZone: "America/Los_Angeles"}) + " PST"}`
            },
            {
              "type": "mrkdwn",
              "text": `*Reviewers:*\n ${reviewers.length === 0 ? "None" : reviewers.join(",")}`
            }
          ]
        }
      ];
      sendMessage(placeToSendMessage, message);
    }
    
    res.writeHead(200);
    res.write('OK'); 
    res.end(); 
  });
}

// Pull request review submitted, edited, or dismissed. 
const pullReviewHandler = (req, res) => {
  console.log("PULLSREVIEWHANDLER: ");
  let body = '';
  
  req.on('data', (chunk) => {
      body += chunk;
  });
  
  req.on('end', () => {
    body = JSON.parse(body);
    console.log(body);
    const createdDate = body.pull_request.created_at;
    const repositoryName = body.repository.name;
    const pullReviewOwnerName = body.repository.owner.login;
    const pullRequestId = body.pull_request.number;
    const repositoryLink = body.repository.html_url;
    const pullRequestTitle = body.pull_request.title;
    const pullRequestUrl = body.pull_request.html_url;
    const prReviewers = body.pull_request.requested_reviewers;
    
    // make reviewers into taggable format
    let reviewers = [];
    for (let reviewer of prReviewers) {
      if (reviewer.login.includes("-")) {
        reviewers.push(reviewer.login.replace("-", "."));
      } else {
        reviewers.push(reviewer.login);
      }
    }
    
    if (body.action === "submitted") {
      // start writing code here
      
      const message = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*${body.review.user.login}* has reviewed the pull request: *<${pullRequestUrl}|${pullRequestTitle}>*`
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Submitted by: ${pullReviewOwnerName} `
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*Repo:*\n *<${repositoryLink}|${repositoryName}>*`
            },
            {
              "type": "mrkdwn",
              "text": `*When:*\nSubmitted ${new Date(createdDate).toLocaleString("en-US", {timeZone: "America/Los_Angeles"}) + " PST"}`
            },
            {
              "type": "mrkdwn",
              "text": `*Reviewers:*\n ${reviewers.length === 0 ? "None" : reviewers.join(",")}`
            },
            {
              "type": "mrkdwn",
              "text": `*Status:*\n ${body.review.state === "approved" ? "✅ Approved" : "⏱️ In Progress"}`
            }
          ]
        }
      ];


      // `Review submitted for pull request #${pullRequestId}: ${pullRequestTitle} in ${repositoryName} by ${pullReviewOwnerName} at ${createdDate}` + "\n" + `${pullRequestUrl}`;
      sendMessage(placeToSendMessage, message);
    }
      

    res.writeHead(200);
    res.write('OK');   
    res.end(); 
  });
};

// Pull request diff comment created, edited, or deleted.
const pullReviewCommentsHandler = async (req, res) => {
  console.log("PULLSREVIEWCOMMENTSHANDLER: ");
  let body = '';
  
  req.on('data', (chunk) => {
      body += chunk;
  });
  
  req.on('end', () => {
    body = JSON.parse(body);
    console.log(body);
      
    // start writing code here
    const createdDate = body.pull_request.created_at;
    const repositoryName = body.repository.name;
    const pullReviewOwnerName = body.repository.owner.login;
    const pullRequestId = body.pull_request.number;
    const pullRequestTitle = body.pull_request.title;
    const pullRequestUrl = body.pull_request.html_url;
    const commentUser = body.comment.user.login;
    const repositoryLink = body.repository.html_url;
    const commentBody = body.comment.body;
    const prReviewers = body.pull_request.requested_reviewers;
    
      // make reviewers into taggable format
    let reviewers = [];
    for (let reviewer of prReviewers) {
      if (reviewer.login.includes("-")) {
        reviewers.push(reviewer.login.replace("-", "."));
      } else {
        reviewers.push(reviewer.login);
      }
    }
    
    console.log(reviewers)
    
    if (body.action === "created") {
        const message = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*${commentUser}* has commented on *<${pullRequestUrl}|${pullRequestTitle}>*: "${commentBody}"`
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `PR submitted by: ${pullReviewOwnerName} `
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*Repo:*\n *<${repositoryLink}|${repositoryName}>*`
            },
            {
              "type": "mrkdwn",
              "text": `*When:*\nSubmitted ${new Date(createdDate).toLocaleString("en-US", {timeZone: "America/Los_Angeles"}) + " PST"}`
            },
            {
              "type": "mrkdwn",
              "text": `*Reviewers:*\n ${reviewers.length === 0 ? "None" : reviewers.join(",")}`
            }
          ]
        }
      ];
      sendMessage(placeToSendMessage, message);
    }
    
    res.writeHead(200);
    res.write('OK'); 
    res.end(); 
  });
};


app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  customRoutes: [
    {
      path: "/pulls",
      method: ["POST"],
      handler: pullsHandler
    },
    {
      path: "/pullReviews",
      method: ["POST"],
      handler: pullReviewHandler
    },
    {
      path: "/pullReviewComments",
      method: ["POST"],
      handler: pullReviewCommentsHandler
    }
  ],
});


(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("Compiled");
})();