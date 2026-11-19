-- v1.5 spawn safety: guarantees every player gets a character.
-- Original code for BRAINROT MEGA UNIVERSE v1.5.
-- (A past build shipped with CharacterAutoLoads false and the character never
-- spawned. This script asserts it true and re-issues LoadCharacter as a net.)

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

Players.CharacterAutoLoads = true

local function ensureCharacter(player: Player)
	task.delay(5, function()
		if player.Parent == nil then
			return
		end
		if not player.Character then
			player:LoadCharacter()
		end
	end)
end

local function onPlayerAdded(player: Player)
	ensureCharacter(player)
	player.CharacterAdded:Connect(function(character: Model)
		local root = character:WaitForChild("HumanoidRootPart", 10)
		if root then
			print("[v1.5] Spawned " .. player.Name .. " at " .. tostring(root.Position))
		end
	end)
end

Players.PlayerAdded:Connect(onPlayerAdded)

local world = Workspace:FindFirstChild("World")
local spawn = world and world:FindFirstChild("SpawnLocation")
if spawn then
	print("[v1.5] SpawnLocation ready at " .. tostring(spawn.Position))
else
	warn("[v1.5] SpawnLocation missing — characters may spawn at origin")
end
