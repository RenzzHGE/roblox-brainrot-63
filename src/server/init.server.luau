-- v1.5 server bootstrap: verifies the world and logs player joins/leaves.
-- Original code for BRAINROT MEGA UNIVERSE v1.5.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.config)

local function verifySpawn()
	local world = Workspace:FindFirstChild("World")
	local spawn = world and world:FindFirstChild("SpawnLocation")
	if spawn then
		print("[v1.5] SpawnLocation verified at " .. tostring(spawn.Position))
	else
		warn("[v1.5] SpawnLocation missing from Workspace.World")
	end
end

local function onPlayerAdded(player: Player)
	print("[v1.5] Player joined: " .. player.Name)
end

local function onPlayerRemoving(player: Player)
	print("[v1.5] Player left: " .. player.Name)
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)
verifySpawn()
print("[v1.5] " .. Config.GAME_NAME .. " v" .. Config.GAME_VERSION .. " server ready")
