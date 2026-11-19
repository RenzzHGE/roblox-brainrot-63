-- v1.5 client bootstrap: hangout HUD (title, menu button, chat hint).
-- Original code for BRAINROT MEGA UNIVERSE v1.5.

local Players = game:GetService("Players")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local gui = Instance.new("ScreenGui")
gui.Name = "HangoutGui"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.Parent = playerGui

local title = Instance.new("TextLabel")
title.Name = "Title"
title.AnchorPoint = Vector2.new(0.5, 0)
title.Position = UDim2.new(0.5, 0, 0, 12)
title.Size = UDim2.new(0, 420, 0, 36)
title.BackgroundTransparency = 1
title.Text = "BRAINROT MEGA UNIVERSE"
title.TextColor3 = Color3.fromRGB(255, 240, 200)
title.TextSize = 26
title.Font = Enum.Font.SourceSansBold
title.TextStrokeTransparency = 0.4
title.Parent = gui

local hint = Instance.new("TextLabel")
hint.Name = "ChatHint"
hint.AnchorPoint = Vector2.new(0.5, 1)
hint.Position = UDim2.new(0.5, 0, 1, -16)
hint.Size = UDim2.new(0, 420, 0, 28)
hint.BackgroundTransparency = 0.6
hint.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
hint.Text = "Say something to the forest..."
hint.TextColor3 = Color3.fromRGB(220, 220, 220)
hint.TextSize = 16
hint.Font = Enum.Font.SourceSans
hint.Parent = gui

local menu = Instance.new("TextButton")
menu.Name = "MenuButton"
menu.AnchorPoint = Vector2.new(1, 0)
menu.Position = UDim2.new(1, -12, 0, 12)
menu.Size = UDim2.new(0, 90, 0, 36)
menu.BackgroundColor3 = Color3.fromRGB(40, 40, 55)
menu.Text = "MENU"
menu.TextColor3 = Color3.fromRGB(255, 255, 255)
menu.TextSize = 18
menu.Font = Enum.Font.SourceSansBold
menu.Parent = gui

menu.MouseButton1Click:Connect(function()
	hint.Text = "Ngobrol, nyanyi, nongkrong — selamat datang di hutan."
	task.delay(3, function()
		hint.Text = "Say something to the forest..."
	end)
end)
