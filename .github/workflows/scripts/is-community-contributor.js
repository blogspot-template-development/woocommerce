// Note you'll need to install this dependency as part of your workflow.
const { Octokit } = require('@octokit/action');

// Note that this script assumes you set GITHUB_TOKEN in env, if you don't
// this won't work.
const octokit = new Octokit();

const getIssueAuthor = (payload) => {
	return payload?.issue?.user?.login || payload?.pull_request?.user?.login || null;
}

const isCommunityContributor = async (owner, repo, username)  => {
	if (username) {
		const {data: {permission}} = await octokit.rest.repos.getCollaboratorPermissionLevel({
			owner,
			repo,
			username,
		});
	
		return permission === 'read' || permission === 'none';
	}

	return false;	
}

const addLabel = async(label, owner, repo, issueNumber) => {
	await octokit.rest.issues.addLabels({
		owner,
		repo,
		issue_number: issueNumber,
		labels: [label],
	});
}

const applyLabelToCommunityContributor = async () => {
	const eventPayload = require(process.env.GITHUB_EVENT_PATH);
	const username = getIssueAuthor(eventPayload);
	const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
	const { number } = eventPayload?.issue || eventPayload?.pull_request;
	
	const isCommunityUser = await isCommunityContributor(owner, repo, username);
	console.log( '::set-output name=is-community::%s', isCommunityUser ? 'yes' : 'no' );
	
	if (isCommunityUser) {
		console.log('Adding community contributor label');
		await addLabel('type: community contribution', owner, repo, number);
	}
}

applyLabelToCommunityContributor();
