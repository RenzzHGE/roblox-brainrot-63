-- v1.5 proximity prompts: sit on benches, read signposts, browse stalls.
-- Original code for BRAINROT MEGA UNIVERSE v1.5.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local toastGui = Instance.new("ScreenGui")
toastGui.Name = "ToastGui"
toastGui.ResetOnSpawn = false
toastGui.Parent = playerGui

local toast = Instance.new("TextLabel")
toast.Name = "Toast"
toast.AnchorPoint = Vector2.new(0.5, 0)
toast.Position = UDim2.new(0.5, 0, 0, 64)
toast.Size = UDim2.new(0, 380, 0, 34)
toast.BackgroundColor3 = Color3.fromRGB(25, 25, 40)
toast.BackgroundTransparency = 0.2
toast.Text = ""
toast.TextColor3 = Color3.fromRGB(255, 240, 200)
toast.TextSize = 16
toast.Font = Enum.Font.SourceSansBold
toast.Visible = false
toast.Parent = toastGui

local function showToast(text: string)
	toast.Text = text
	toast.Visible = true
	task.delay(3, function()
		toast.Visible = false
	end)
end

local function attachPrompt(part: BasePart, actionText: string, onTrigger: () -> ())
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = actionText
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.HoldDuration = 0
	prompt.Parent = part
	prompt.Triggered:Connect(function(triggeringPlayer: Player)
		if triggeringPlayer == player then
			onTrigger()
		end
	end)
end

local world = Workspace:WaitForChild("World", 30)
if world then
	for _, desc in ipairs(world:GetDescendants()) do
		if desc:IsA("Seat") then
			attachPrompt(desc, "Duduk", function()
				showToast("Selamat duduk santai di hutan.")
			end)
		elseif desc:IsA("BasePart") and desc.Name == "SignBoard" then
			attachPrompt(desc, "Baca Papan", function()
				showToast("Papan petunjuk: Air Terjun, Air Mancur, Rumah Kayu.")
			end)
		elseif desc:IsA("BasePart") and desc.Name == "StallCounter" then
			attachPrompt(desc, "Lihat Jualan", function()
				showToast("Warung hutan: camilan dan minuman hangat.")
			end)
		end
	end
end
