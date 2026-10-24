(() => {
  const repository = "SargeMadovsky/ChroMinimum";
  const releasesPage = `https://github.com/${repository}/releases`;
  const version = document.getElementById("release-version");
  const links = document.querySelectorAll("[data-release-download='windows']");
  const platformLinks = document.querySelectorAll("[data-release-platform]");
  const platformFiles = {
    windows: [/-setup-x64\.exe$/i, /-windows-x64\.zip$/i],
    linux: [/-linux-x64\.tar\.gz$/i],
    macos: [/-macos-arm64\.tar\.gz$/i],
  };
  const requestedDownload = new URLSearchParams(window.location.search).get("download");
  const findAsset = (release, platform) => (platformFiles[platform] || [])
    .map(pattern => release.assets.find(asset => pattern.test(asset.name)))
    .find(Boolean);

  const fallbackToReleases = () => {
    version.textContent = "Актуальная версия — на GitHub";
    links.forEach(link => {
      link.href = releasesPage;
      link.textContent = "Открыть все релизы ↗";
    });
    platformLinks.forEach(link => {
      link.href = releasesPage;
      const label = link.querySelector("small");
      if (label) label.textContent = "Версии и файлы на GitHub ↗";
    });
    if (Object.hasOwn(platformFiles, requestedDownload)) window.location.replace(releasesPage);
  };

  fetch(`https://api.github.com/repos/${repository}/releases?per_page=100`, {
    headers: { Accept: "application/vnd.github+json" },
  })
    .then(response => {
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
      return response.json();
    })
    .then(releases => {
      if (!Array.isArray(releases)) throw new Error("Invalid releases response");
      const published = releases
        .filter(release => !release.draft && /^v\d+\.\d+\.\d+(?:-|$)/.test(release.tag_name))
        .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
      const downloads = Object.fromEntries(Object.keys(platformFiles).map(platform => {
        const release = published.find(item => findAsset(item, platform));
        return [platform, release ? { release, asset: findAsset(release, platform) } : null];
      }));
      const windows = downloads.windows;
      if (!windows) throw new Error("No published Windows build found");
      const tag = windows.release.tag_name;
      version.textContent = `${tag} · ранний прототип`;
      links.forEach(link => {
        link.href = windows.asset.browser_download_url;
        link.textContent = /-setup-x64\.exe$/i.test(windows.asset.name)
          ? `Скачать установщик ${tag} ↗` : `Скачать ${tag} ↗`;
      });
      platformLinks.forEach(link => {
        const download = downloads[link.dataset.releasePlatform];
        link.href = download?.asset.browser_download_url || releasesPage;
        const label = link.querySelector("small");
        if (label) label.textContent = download
          ? `${link.dataset.releasePlatform === "macos" ? "Apple Silicon" : "x64"} · ${download.release.tag_name}`
          : "Файлы пока не опубликованы";
      });
      document.querySelectorAll("[data-pending-release]").forEach(section => {
        if (published.some(release => release.tag_name === section.dataset.pendingRelease)) section.hidden = true;
      });
      if (Object.hasOwn(platformFiles, requestedDownload)) {
        window.location.replace(downloads[requestedDownload]?.asset.browser_download_url || releasesPage);
      }
    })
    .catch(fallbackToReleases);
})();
