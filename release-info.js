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

  const findAsset = (release, platform) => {
    const patterns = platformFiles[platform] || [];
    return patterns.map(pattern => release.assets.find(asset => pattern.test(asset.name)))
      .find(Boolean);
  };

  const fallbackToReleases = () => {
    version.textContent = "Актуальная версия — на GitHub";
    links.forEach(link => {
      link.href = releasesPage;
      link.textContent = "Открыть все релизы ↗";
    });
    platformLinks.forEach(link => { link.href = releasesPage; });
    if (["windows", "linux", "macos"].includes(new URLSearchParams(window.location.search).get("download"))) {
      window.location.replace(releasesPage);
    }
  };

  fetch(`https://api.github.com/repos/${repository}/releases?per_page=1`, {
    headers: { Accept: "application/vnd.github+json" },
  })
    .then(response => {
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
      return response.json();
    })
    .then(releases => {
      const release = Array.isArray(releases) && releases.find(item => !item.draft);
      if (!release || !release.tag_name) throw new Error("No published release found");

      const tag = release.tag_name;
      const installer = release.assets.find(asset => /-setup-x64\.exe$/i.test(asset.name));
      version.textContent = `${tag} · ранний прототип`;

      links.forEach(link => {
        link.href = (installer || findAsset(release, "windows"))?.browser_download_url || release.html_url;
        link.textContent = installer ? `Скачать установщик ${tag} ↗` : `Скачать ${tag} ↗`;
      });

      platformLinks.forEach(link => {
        const platform = link.dataset.releasePlatform;
        const asset = findAsset(release, platform);
        link.href = asset?.browser_download_url || release.html_url;
        const label = link.querySelector("small");
        if (label) label.textContent = asset ? `${label.textContent.split(" · ")[0]} · ${tag}` : `${tag} · файлы релиза`;
      });

      const requestedDownload = new URLSearchParams(window.location.search).get("download");
      if (["windows", "linux", "macos"].includes(requestedDownload)) {
        const asset = requestedDownload === "windows"
          ? (installer || findAsset(release, "windows"))
          : findAsset(release, requestedDownload);
        window.location.replace(asset?.browser_download_url || release.html_url);
      }
    })
    .catch(fallbackToReleases);
})();
