-- v1.5 karaoke queue (lake deck). Server authority; clients sync via RemoteEvents.
-- Original code for BRAINROT MEGA UNIVERSE v1.5.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.config)

local stateEvent = Instance.new("RemoteEvent")
stateEvent.Name = "KaraokeState"
stateEvent.Parent = ReplicatedStorage

local submitEvent = Instance.new("RemoteEvent")
submitEvent.Name = "KaraokeSubmit"
submitEvent.Parent = ReplicatedStorage

local queue = {} -- array of QueueSong tables
local current = nil -- QueueSong? currently singing
local currentExpiresAt = 0 -- os.clock() time when the current song ends

local updateBillboard -- forward declaration (assigned below)

local function broadcast()
	stateEvent:FireAllClients({ current = current, queue = queue })
end

local function cleanTitle(title)
	if typeof(title) ~= "string" then
		return nil
	end
	local t = string.gsub(title, "^%s+", "")
	t = string.gsub(t, "%s+$", "")
	if #t == 0 or #t > 60 then
		return nil
	end
	return t
end

local function advanceQueue()
	current = table.remove(queue, 1)
	if current then
		currentExpiresAt = os.clock() + Config.Karaoke.SongSeconds
	else
		currentExpiresAt = 0
	end
	updateBillboard()
	broadcast()
end

updateBillboard = function()
	local world = Workspace:FindFirstChild("World")
	local screen = world and world:FindFirstChild("KaraokeScreen")
	if not screen then
		return
	end
	local gui = screen:FindFirstChild("KaraokeBillboard")
	if not gui then
		gui = Instance.new("BillboardGui")
		gui.Name = "KaraokeBillboard"
		gui.Size = UDim2.new(0, 340, 0, 90)
		gui.StudsOffset = Vector3.new(0, 4.5, 0)
		gui.AlwaysOnTop = true
		gui.Parent = screen
		local label = Instance.new("TextLabel")
		label.Name = "SongLabel"
		label.Size = UDim2.new(1, 0, 1, 0)
		label.BackgroundTransparency = 0.4
		label.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
		label.TextColor3 = Color3.fromRGB(255, 220, 120)
		label.TextScaled = true
		label.Font = Enum.Font.SourceSansBold
		label.Parent = gui
	end
	local label = gui:FindFirstChild("SongLabel")
	if label then
		if current then
			label.Text = "♪ " .. current.songTitle .. " — " .. current.userName
		else
			label.Text = "♪ KARAOKE — antrean kosong"
		end
	end
end

submitEvent.OnServerEvent:Connect(function(player: Player, title)
	local clean = cleanTitle(title)
	if not clean then
		return
	end
	if #queue >= Config.Karaoke.MaxQueue then
		return
	end
	table.insert(queue, {
		userId = player.UserId,
		userName = player.Name,
		songTitle = clean,
		queuedAt = os.time(),
	})
	if not current then
		advanceQueue()
	else
		broadcast()
	end
end)

Players.PlayerRemoving:Connect(function(player: Player)
	if current and current.userId == player.UserId then
		advanceQueue()
	end
	for i = #queue, 1, -1 do
		if queue[i].userId == player.UserId then
			table.remove(queue, i)
		end
	end
	broadcast()
end)

task.spawn(function()
	while true do
		task.wait(1)
		if current and os.clock() >= currentExpiresAt then
			advanceQueue()
		end
	end
end)

updateBillboard()
print("[v1.5] Karaoke queue ready (max " .. Config.Karaoke.MaxQueue .. " songs, "
	.. Config.Karaoke.SongSeconds .. "s each)")
