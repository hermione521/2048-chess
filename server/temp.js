var redis = require("redis");
var client = redis.createClient();
client.lpop("gamers", redis.print);
