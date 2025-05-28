# Roblox Experience Notifications (API)

## Send Experience Notification (POST)
### https://roblox-notifications.arxk.cloud/api/send-experience-notification

### Headers
- X-Cloud-Api-Key: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Body
- `userId`: The ID of the player to send the notification to.
- `universeId`: The ID of the universe to send the notification to.
- `assetId`: The message ID of your asset containing the template of the notification.
- `delayTimestamp`: (Optional) The delay in milliseconds before sending the notification. (Can be a date or a timestamp (2025-01-01T00:00:00.000Z or 1716460800000))

## Get Experience Notification Status (GET)
### https://roblox-notifications.arxk.cloud/api/get-experience-notification-status?jobId=xxxxxxxxxxx

### Query Params
- `jobId`: The ID of the job to get the status of.

## Cancel Experience Notification (POST)
### https://roblox-notifications.arxk.cloud/api/cancel-experience-notification

### Body
- `jobId`: The ID of the job to cancel.