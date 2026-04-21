fetch("http://localhost:4000/api/v2/yt/trending?category=trending&region=US").then(res => res.json()).then(data => console.log(JSON.stringify(data.videos[0])))
