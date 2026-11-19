-- v1.5 ambient world script (runs in Workspace): particles, sign labels,
-- karaoke screen label, and the TreeForest grove clones.
-- Original code for BRAINROT MEGA UNIVERSE v1.5.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")

local Config = require(ReplicatedStorage.Shared.config)

-- Post-processing effects + lighting (created at runtime: Rojo's reflection
-- database does not know SunRays/Atmosphere/BloomEffect properties nor
-- Lighting.ColorShiftTop/Bottom, so they cannot be declared in
-- default.project.json).
Lighting.ClockTime = 17.5
Lighting.Brightness = 2.2
Lighting.ColorShift_Top = Color3.fromRGB(255, 190, 120)
Lighting.ColorShift_Bottom = Color3.fromRGB(80, 50, 90)
Lighting.Ambient = Color3.fromRGB(70, 60, 80)
Lighting.OutdoorAmbient = Color3.fromRGB(90, 75, 100)
Lighting.FogEnabled = true
Lighting.FogStart = 40
Lighting.FogEnd = 350
Lighting.FogColor = Color3.fromRGB(180, 140, 165)
Lighting.GlobalShadows = true
Lighting.Technology = Enum.Technology.ShadowMap

local atmosphere = Instance.new("Atmosphere")
atmosphere.Density = 0.35
atmosphere.Offset = 0.25
atmosphere.Color = Color3.fromRGB(210, 160, 150)
atmosphere.Decay = Color3.fromRGB(70, 50, 80)
atmosphere.Glare = 0.4
atmosphere.Haze = 1.5
atmosphere.Parent = Lighting

local sunRays = Instance.new("SunRays")
sunRays.Intensity = 0.35
sunRays.Spread = 0.8
sunRays.Parent = Lighting

local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.4
bloom.Size = 24
bloom.Threshold = 0.8
bloom.Parent = Lighting

local world = Workspace:WaitForChild("World", 30)
if not world then
	warn("[v1.5] World model not found — ambient script stopping")
	return
end

-- Clone the tree-forest asset into the grove spots.
local assets = ReplicatedStorage:FindFirstChild("AssetModels")
local forest = assets and assets:FindFirstChild("TreeForest")
if forest then
	local placed = 0
	for _, pos in ipairs(Config.Grove) do
		local ok = pcall(function()
			local clone = forest:Clone()
			local _, size = clone:GetBoundingBox()
			clone:PivotTo(CFrame.new(pos + Vector3.new(0, size.Y / 2, 0)))
			clone.Parent = world
		end)
		if ok then
			placed += 1
		end
	end
	print("[v1.5] Cloned " .. placed .. " tree-forest models into the grove")
else
	warn("[v1.5] TreeForest asset missing from ReplicatedStorage.AssetModels")
end

-- Particle helpers.
local function anchorPart(name: string, pos: Vector3)
	local p = Instance.new("Part")
	p.Name = name
	p.Anchored = true
	p.CanCollide = false
	p.Transparency = 1
	p.Size = Vector3.new(1, 1, 1)
	p.Position = pos
	p.Parent = world
	return p
end

local function attachEmitter(parent: Instance, props)
	local emitter = Instance.new("ParticleEmitter")
	for key, value in pairs(props) do
		emitter[key] = value
	end
	emitter.Parent = parent
	return emitter
end

-- Waterfall mist at the base of the falls.
attachEmitter(anchorPart("MistAnchor", Config.Zones.WaterfallBase), {
	Rate = 150,
	Speed = NumberRange.new(5, 12),
	Lifetime = NumberRange.new(0.8, 1.5),
	Size = NumberSequence.new(2, 8),
	Color = ColorSequence.new(Color3.fromRGB(240, 244, 248), Color3.fromRGB(200, 215, 230)),
	Transparency = NumberSequence.new(0.4, 0.9),
})

-- Fountain spray jet.
attachEmitter(anchorPart("SprayAnchor", Vector3.new(0, 5, 0)), {
	Rate = 200,
	Speed = 25,
	SpreadAngle = Vector2.new(5, 5),
	Lifetime = NumberRange.new(0.5, 0.7),
	Size = NumberSequence.new(0.5, 1.5),
	Color = ColorSequence.new(Color3.fromRGB(220, 235, 245)),
	Transparency = NumberSequence.new(0.2, 0.8),
})

-- Fireflies near the lake edge and the forest.
for _, pos in ipairs(Config.Fireflies) do
	attachEmitter(anchorPart("FireflyAnchor", pos), {
		Rate = 30,
		Speed = NumberRange.new(1, 3),
		Lifetime = NumberRange.new(2, 4),
		Size = NumberSequence.new(0.15),
		Color = ColorSequence.new(Color3.fromRGB(255, 230, 100)),
		Transparency = NumberSequence.new(0.2, 0.6),
		SpreadAngle = Vector2.new(180, 180),
	})
end

-- Sky lanterns rising into the evening sky.
for _, pos in ipairs(Config.Lanterns) do
	attachEmitter(anchorPart("LanternAnchor", pos), {
		Rate = 5,
		Speed = NumberRange.new(2, 4),
		Lifetime = NumberRange.new(6, 10),
		Size = NumberSequence.new(0.8),
		Color = ColorSequence.new(Color3.fromRGB(255, 140, 50)),
		Transparency = NumberSequence.new(0.3, 0.9),
		EmissionDirection = Enum.NormalId.Top,
	})
end

-- Sign labels (matched to each board by its height).
local function addLabel(part: BasePart, text: string, textColor: Color3)
	local gui = Instance.new("SurfaceGui")
	gui.Name = "LabelGui"
	gui.Face = Enum.NormalId.Front
	gui.Parent = part
	local label = Instance.new("TextLabel")
	label.Name = "Label"
	label.Size = UDim2.new(1, 0, 1, 0)
	label.BackgroundTransparency = 1
	label.Text = text
	label.TextColor3 = textColor
	label.TextScaled = true
	label.Font = Enum.Font.SourceSansBold
	label.Parent = gui
end

for _, desc in ipairs(world:GetDescendants()) do
	if desc:IsA("BasePart") and desc.Name == "SignBoard" then
		local y = desc.Position.Y
		for _, sign in ipairs(Config.Signs) do
			if math.abs(y - sign.Height) < 0.3 then
				addLabel(desc, sign.Text, Color3.fromRGB(255, 255, 255))
			end
		end
	end
end

local screen = world:FindFirstChild("KaraokeScreen")
if screen then
	addLabel(screen, "♪ KARAOKE ♪", Color3.fromRGB(255, 220, 120))
end

print("[v1.5] Ambient world ready (mist, spray, fireflies, lanterns, signs)")
