-- v1.5 karaoke UI: queue panel, now-playing label, song submit box.
-- Original code for BRAINROT MEGA UNIVERSE v1.5.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local stateEvent = ReplicatedStorage:WaitForChild("KaraokeState", 30)
local submitEvent = ReplicatedStorage:WaitForChild("KaraokeSubmit", 30)

local gui = Instance.new("ScreenGui")
gui.Name = "KaraokeGui"
gui.ResetOnSpawn = false
gui.Parent = playerGui

local panel = Instance.new("Frame")
panel.Name = "QueuePanel"
panel.AnchorPoint = Vector2.new(1, 0)
panel.Position = UDim2.new(1, -12, 0, 60)
panel.Size = UDim2.new(0, 260, 0, 220)
panel.BackgroundColor3 = Color3.fromRGB(25, 25, 40)
panel.BackgroundTransparency = 0.15
panel.Parent = gui

local header = Instance.new("TextLabel")
header.Name = "Header"
header.Size = UDim2.new(1, 0, 0, 30)
header.BackgroundTransparency = 1
header.Text = "♪ KARAOKE QUEUE"
header.TextColor3 = Color3.fromRGB(255, 220, 120)
header.TextSize = 18
header.Font = Enum.Font.SourceSansBold
header.Parent = panel

local nowPlaying = Instance.new("TextLabel")
nowPlaying.Name = "NowPlaying"
nowPlaying.Position = UDim2.new(0, 8, 0, 34)
nowPlaying.Size = UDim2.new(1, -16, 0, 44)
nowPlaying.BackgroundTransparency = 1
nowPlaying.Text = "Antrean kosong"
nowPlaying.TextColor3 = Color3.fromRGB(235, 235, 235)
nowPlaying.TextSize = 15
nowPlaying.Font = Enum.Font.SourceSans
nowPlaying.TextWrapped = true
nowPlaying.TextXAlignment = Enum.TextXAlignment.Left
nowPlaying.Parent = panel

local box = Instance.new("TextBox")
box.Name = "SongBox"
box.Position = UDim2.new(0, 8, 0, 140)
box.Size = UDim2.new(1, -16, 0, 32)
box.BackgroundColor3 = Color3.fromRGB(45, 45, 65)
box.Text = ""
box.PlaceholderText = "Judul lagu..."
box.TextColor3 = Color3.fromRGB(255, 255, 255)
box.TextSize = 15
box.Font = Enum.Font.SourceSans
box.Parent = panel

local submit = Instance.new("TextButton")
submit.Name = "SubmitButton"
submit.Position = UDim2.new(0, 8, 0, 180)
submit.Size = UDim2.new(1, -16, 0, 30)
submit.BackgroundColor3 = Color3.fromRGB(90, 140, 60)
submit.Text = "MASUK ANTREAN"
submit.TextColor3 = Color3.fromRGB(255, 255, 255)
submit.TextSize = 16
submit.Font = Enum.Font.SourceSansBold
submit.Parent = panel

local function render(state)
	if not state then
		return
	end
	local cur = state.current
	if cur then
		nowPlaying.Text = "Sedang nyanyi: " .. cur.songTitle .. " — " .. cur.userName
	else
		nowPlaying.Text = "Antrean kosong — jadi penyanyi pertama!"
	end
end

if stateEvent then
	stateEvent.OnClientEvent:Connect(render)
end

submit.MouseButton1Click:Connect(function()
	local title = box.Text
	if title and #title > 0 and submitEvent then
		submitEvent:FireServer(title)
		box.Text = ""
	end
end)
