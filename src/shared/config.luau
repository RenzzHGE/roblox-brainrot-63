-- v1.5 shared configuration: palettes, zones and tuning.
-- Original code for BRAINROT MEGA UNIVERSE v1.5 (NGOBROL-style forest hangout).

local Config = {}

Config.GAME_NAME = "BRAINROT MEGA UNIVERSE"
Config.GAME_VERSION = "1.5"

Config.Palette = {
	GrassDeep = Color3.fromRGB(34, 68, 34),
	GrassMid = Color3.fromRGB(70, 130, 50),
	GrassSun = Color3.fromRGB(140, 185, 50),
	Dirt = Color3.fromRGB(115, 85, 55),
	DirtEdge = Color3.fromRGB(90, 85, 75),
	GroundBase = Color3.fromRGB(80, 65, 45),
	LakeWater = Color3.fromRGB(35, 95, 140),
	FountainWater = Color3.fromRGB(50, 120, 170),
	FallWater = Color3.fromRGB(200, 220, 240),
	WoodCabin = Color3.fromRGB(95, 55, 35),
	WoodPlank = Color3.fromRGB(120, 80, 50),
	WoodBench = Color3.fromRGB(110, 70, 45),
	NeonWindow = Color3.fromRGB(255, 170, 60),
	FoliageDeep = Color3.fromRGB(20, 50, 30),
	FoliageMid = Color3.fromRGB(45, 95, 50),
	FoliageSun = Color3.fromRGB(90, 140, 60),
}

Config.Zones = {
	FountainPlaza = Vector3.new(0, 0, 0),
	Lake = Vector3.new(-10, -1.5, -45),
	Waterfall = Vector3.new(-40, 15, -70),
	WaterfallBase = Vector3.new(-38, 2, -62),
	KaraokeDeck = Vector3.new(15, 1, -40),
	Cabin = Vector3.new(35, 2, -10),
	Spawn = Vector3.new(0, 2, 15),
	Signpost = Vector3.new(4, 0, 8),
}

Config.Karaoke = {
	MaxQueue = 10,
	SongSeconds = 30,
	DeckPosition = Vector3.new(15, 1, -40),
	ScreenPosition = Vector3.new(15, 5, -48.5),
}

-- Sign boards are matched to their text by height (see world script).
Config.Signs = {
	{ Height = 5.6, Text = "AIR TERJUN <-" },
	{ Height = 4.4, Text = "AIR MANCUR <-" },
	{ Height = 3.2, Text = "RUMAH KAYU ->" },
}

-- Grove spots where the runtime world script clones the TreeForest asset.
-- (The three spots nearest the waterfall/rainbow are left out so the falls
-- stay visible from the south-east — see tools/build-world.mjs.)
Config.Grove = {
	Vector3.new(-55, 0, -30),
	Vector3.new(-48, 0, -15),
	Vector3.new(-58, 0, -5),
	Vector3.new(-38, 0, -25),
	Vector3.new(-62, 0, -20),
}

Config.Fireflies = {
	Vector3.new(-8, 2, -38),
	Vector3.new(-30, 3, 10),
}

Config.Lanterns = {
	Vector3.new(0, 8, -20),
	Vector3.new(25, 10, 5),
}

return Config
