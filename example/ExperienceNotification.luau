--[[
	Arxk

	Be sure when you create an API key for the cloud API, you only give it set permissions to ONLY run
	notifications. The API key you provide for the cloud will be encrypted and not stored in plain text.

	When you create a secret, be sure to make the endpoint "roblox-notifications.arxk.cloud", meaning
	it will only be allowed to attach the secret to requests on that endpoint

	To test secrets locally (in studio), you can enable http requests in settings & add these:

	{
		"CLOUD_API_KEY": ["xxxxxxxx", "roblox-notifications.arxk.cloud"],
		"ENDPOINT_API_KEY": ["xxxxxxxxxxxx", "roblox-notifications.arxk.cloud"]
	}

	The values are expected to be Base64 encoded, so you'll need to encode values before using secrets locally
]]

-- Services
local HttpService = game:GetService("HttpService");

-- Constants
local UNIVERSE_ID = game.GameId;
local API_ENDPOINT = "https://roblox-notifications.arxk.cloud/api";
local ENDPOINTS = {
	["Get"] = `{API_ENDPOINT}/get-experience-notification-status`,
	["Send"] = `{API_ENDPOINT}/send-experience-notification`,
	["Cancel"] = `{API_ENDPOINT}/cancel-experience-notification`,
}

-- Types
type Job = {
	userId: string;
	universeId: string;
	assetId: string;
	status: string;
}

type SendResponse = {
	message: string;
	jobId: string;
	status: string
}

type GetResponse = {
	message: string;
	data: {Job};
	status: string;
}

type CancelResponse = {
	message: string;
	status: string
}

-- Helpers
function AttachKey(name: string)
	return HttpService:GetSecret(name);
end

-- ExperienceNotification
local ExperienceNotification = {};

--[[
	Send a notification (adds into a queue, processed in order & depending on the time provided)

	dateTime: DateTime | number (this can be a DateTime object or a number in milliseconds)
	userId: The user for the notification
	assetId: The notification template asset id
]]
function ExperienceNotification:Send(dateTime: DateTime | number, userId: number, assetId: number): SendResponse | nil
	if (typeof(dateTime) == "DateTime") then
		dateTime = dateTime.UnixTimestampMillis;
	end;

	local Response = HttpService:RequestAsync({
		Url = ENDPOINTS.Send,
		Method = "POST",
		Headers = {
			["Content-Type"] = "application/json",
			["X-Cloud-Api-Key"] = AttachKey("CLOUD_API_KEY")
		},
		Body = HttpService:JSONEncode({
			userId = tostring(userId),
			universeId = tostring(UNIVERSE_ID),
			assetId = tostring(assetId),
			delayTimestamp = tostring(dateTime),
		}),
	});

	if (Response.Success) then
		print("Status code:", Response.StatusCode, Response.StatusMessage);
		print("Response body:\n", Response.Body);
	else
		print("The request failed:", Response.StatusCode, Response.StatusMessage);
		return nil;
	end;

	return HttpService:JSONDecode(Response.Body);
end

--[[
	You can get a job (notification in queue) by providing a jobId (you get this when you send)

	jobId: string
]]
function ExperienceNotification:Get(jobId: string): GetResponse | nil
	local Response = HttpService:RequestAsync({
		Url = `{ENDPOINTS.Get}?jobId={jobId}`,
		Method = "GET"
	});

	if (Response.Success) then
		print("Status code:", Response.StatusCode, Response.StatusMessage);
		print("Response body:\n", Response.Body);
	else
		print("The request failed:", Response.StatusCode, Response.StatusMessage);
		return nil;
	end;

	return HttpService:JSONDecode(Response.Body);
end

--[[
	Cancel a notification (will delete the task from the queue)

	jobId: string
]]
function ExperienceNotification:Cancel(jobId: string): CancelResponse | boolean
	local Response = HttpService:RequestAsync({
		Url = ENDPOINTS.Cancel,
		Method = "POST",
		Headers = {
			["Content-Type"] = "application/json",
		},
		Body = HttpService:JSONEncode({
			jobId = tostring(jobId)
		}),
	});

	if (Response.Success) then
		print("Status code:", Response.StatusCode, Response.StatusMessage);
		print("Response body:\n", Response.Body);
	else
		print("The request failed:", Response.StatusCode, Response.StatusMessage);
		return false;
	end;

	return Response.Success;
end

return ExperienceNotification;
