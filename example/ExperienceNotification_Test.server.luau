-- Services
local ReplicatedStorage = game:GetService("ReplicatedStorage");
local Players = game:GetService("Players");

-- Imports
local ExperienceNotifications = require(ReplicatedStorage.ExperienceNotification);

-- Variables
local UsersAndNotificationJobs = {};

-- Constants
local DELAYED_TO_TIME = DateTime.fromUniversalTime(2025, 5, 24, 10, 10, 10);
local ASSET_ID_TEMPLATE = 0;

function onPlayerAdded(player: Player)
	print(`Player joined: {player.Name}`);

	-- Queue notification
	local Response = ExperienceNotifications:Send(
		DELAYED_TO_TIME.UnixTimestampMillis,
		player.UserId,
		ASSET_ID_TEMPLATE
	);

	if (Response) then
		UsersAndNotificationJobs[player] = Response.jobId;
	end;

	print("Queue response:", Response);
end

function onPlayerRemoving(player: Player)
	print(`Player left: {player.Name}`);

	local JobId = UsersAndNotificationJobs[player];
	if (not JobId) then
		warn("Did not find a notification for this job/player", player.UserId);
		return;
	end;

	-- Remove notification
	local Response = ExperienceNotifications:Cancel(
		JobId
	);

	print("Queue cancel response:", Response);
end

-- Players
for _, Player in Players:GetPlayers() do
	onPlayerAdded(Player);
end

Players.PlayerAdded:Connect(onPlayerAdded);
Players.PlayerRemoving:Connect(onPlayerRemoving);