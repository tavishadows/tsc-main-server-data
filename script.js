const defaultUrl =
  "https://script.google.com/macros/s/AKfycbxx32LCl41PZrZRMzv67jNt-C707Dqz9B541Xz4fkpnGpFhIkhZt5a_zOfYKOmjCoS4/exec";
window.placeId = 7131355525;
window.dataUrl = defaultUrl;

const playerData = new Map();
/** @type {HTMLButtonElement} */
const backBtn = document.querySelector("#info-back");

function normalize(str) {
  return str.replaceAll(/[^A-Za-z]/g, "");
}

function calculateBW(hex) {
  // Calculate the team name text colour by using WGC standards
  const rgb = hex.match(/.{2}/g).map((c) => parseInt(c, 16));
  const channelLums = rgb.map((c) => {
    let s = c / 255;
    return s <= 0.04045 ? s / 12.9 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance =
    0.2126 * channelLums[0] + 0.7152 * channelLums[1] + 0.0722 * channelLums[2];
  return luminance > 0.179 ? "black" : "white";
}

function describePlayer(playerData) {
  console.info("describing a player");

  /** @type {HTMLDivElement} */
  const infoDiv = document.querySelector("#information").children[1];
  infoDiv.querySelector("p").innerText = playerData.Nametag.TrueName;
  infoDiv.querySelectorAll("ul").forEach((ul) => ul.replaceChildren([]));

  /** @type {HTMLUListElement} */
  const infolist = infoDiv.querySelector("#user-infolist");
  /** @type {HTMLUListElement} */
  const currency = infoDiv.querySelector("#user-currency");

  const userId = document.createElement("li");
  userId.innerText = `User ID: ${playerData.UserId}`;
  userId.addEventListener("click", () => {
    try {
      navigator.clipboard.writeText(
        `https://roblox.com/users/${playerData.UserId}/profile`,
      );
      alert("Profile URL copied to your clipboard!");
    } catch (_) {
      prompt(
        "Couldn't copy to your clipboard, copy the profile URL here",
        `https://roblox.com/users/${playerData.UserId}/profile`,
      );
    }
  });
  infolist.appendChild(userId);

  if (playerData.Nametag.TrueName !== playerData.Nametag.Username) {
    const username = document.createElement("li");
    username.innerText = `Username: ${playerData.Nametag.Username}`;
    infolist.appendChild(username);
  }

  if (playerData.Nametag.DisplayName) {
    const displayName = document.createElement("li");
    displayName.innerText = `Display Name: ${playerData.Nametag.DisplayName}`;
    infolist.appendChild(displayName);
  }

  const teamName = document.createElement("li");
  teamName.innerText = `Team: ${playerData.Team.Name}`;
  // teamName.style.backgroundColor = `#${playerData.Team.Color}`;
  // teamName.style.color = calculateBW(playerData.Team.Color);
  // teamName.style.padding = '4px';
  // teamName.style.borderRadius = '4px';
  infolist.appendChild(teamName);

  if (playerData.Nametag.RankName) {
    const rankName = document.createElement("li");
    rankName.innerText = `Rank: ${playerData.Nametag.RankName}`;
    infolist.appendChild(rankName);
  }

  const cash = document.createElement("li");
  cash.innerText = `Cash: ${playerData.Currency.Cash}`;
  currency.appendChild(cash);

  const networth = document.createElement("li");
  networth.innerText = `Networth: ${playerData.Currency.Networth}`;
  currency.appendChild(networth);

  infoDiv.parentElement.style.color = calculateBW(playerData.Team.Color);
  infoDiv.parentElement.style.backgroundColor = `#${playerData.Team.Color}`;

  backBtn.parentElement.parentElement.children[0].setAttribute("hidden", "");
  infoDiv.removeAttribute("hidden");
}

function getTemplate(templateId) {
  return document.querySelector(
    `#templates > [data-template-id="${templateId}"]`,
  );
}

function getMain(placeData) {
  let largestServer = [null, []];

  for (const [serverId, data] of Object.entries(placeData)) {
    if (data[0][1] && data[0][1].length > largestServer[1].length) {
      largestServer = [serverId, data[0][1]];
    }
  }

  return largestServer;
}

function renderTeams() {
  const main = getMain(window.data[window.placeId])[1];
  const unsortedTeams = main.reduce((teams, currPlayer) => {
    const teamName = currPlayer.Team.Name;
    if (teams[teamName]) {
      teams[teamName].push(currPlayer);
    } else {
      teams = {
        ...teams,
        [teamName]: [currPlayer],
      };
    }
    return teams;
  }, {});

  const teams = {};
  Object.keys(unsortedTeams)
    .sort((a, b) => a > b)
    .forEach(
      (key) =>
        (teams[key] = unsortedTeams[key].sort(
          (a, b) => a.Nametag.TrueName > b.Nametag.TrueName,
        )),
    );

  const teamList = document.querySelector("#team-holder");
  const information = document.querySelector("#information").children[0];

  teamList.replaceChildren([]);
  information.querySelector("ul").replaceChildren([]);
  playerData.clear();

  for (const [teamName, players] of Object.entries(teams)) {
    /** @type {HTMLElement} */
    const holder = getTemplate("team").cloneNode(true);
    holder.id = normalize(teamName);
    holder.style.borderColor = `#${players[0].Team.Color}`;
    holder.querySelector("a").href = "#" + normalize(teamName);
    holder.querySelector("p").innerText = teamName;
    holder.querySelector("p").style.color = calculateBW(players[0].Team.Color);

    const teamNamePtr = document.createElement("li");
    const ref = document.createElement("a");
    ref.href = "#" + normalize(teamName);
    ref.innerText = teamName;
    teamNamePtr.appendChild(ref);
    information.querySelector("ul").appendChild(teamNamePtr);

    for (const player of players) {
      const entry = document.createElement("li");
      // We <3 the CIS
      if (String(player.Nametag.TrueName).includes("CIS ")) {
        entry.innerText = player.Nametag.TrueName;
      } else {
        entry.innerText = `${player.Nametag.DisplayName} (${player.Nametag.TrueName})`;
      }
      playerData.set(entry, player);
      holder.querySelector("div").style.backgroundColor =
        `#${player.Team.Color}`;
      holder.querySelector("ul").appendChild(entry);
    }

    teamList.appendChild(holder);
  }
}

document.body.addEventListener("click", (ev) => {
  if (!(ev.target instanceof HTMLLIElement)) {
    return;
  }
  if (!playerData.has(ev.target)) {
    return;
  }
  const player = playerData.get(ev.target);
  describePlayer(player);
});

document.querySelector("#loader").addEventListener("click", async (ev) => {
  const btn = ev.target;
  const oldText = btn.innerText;
  btn.innerText = "";
  btn.classList.add("loading");
  btn.setAttribute("disabled", true);
  btn.setAttribute("title", "Fetching from webserver");
  await refreshServerData();
  btn.setAttribute("title", "Rendering output");
  renderTeams();
  btn.classList.remove("loading");
  btn.innerText = oldText;
  btn.removeAttribute("title");
  btn.removeAttribute("disabled");
});
backBtn.addEventListener("click", () => {
  backBtn.parentElement.parentElement.style = "";
  backBtn.parentElement.parentElement.children[1].setAttribute("hidden", "");
  backBtn.parentElement.parentElement.children[0].removeAttribute("hidden");
});

async function refreshServerData() {
  // await new Promise((resolve) => setTimeout(resolve, 30_000));
  return fetch(window.dataUrl, {
    cache: "default",
  })
    .then((r) => r.json())
    .then((resp) => {
      if (window.dataUrl !== defaultUrl) {
        return resp;
      }

      // Google App Script is pain
      const [cached, data] = resp;
      console.debug(cached ? "Data cached!" : "Got a fresh response!");
      return JSON.parse(data).data;
    })
    .then((data) => (window.data = data));
}

setInterval(() => document.querySelector("#loader").click(), 120_000);

document.body.removeAttribute("hidden");
document.querySelector("#loader").click();
