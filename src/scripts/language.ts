const root = document.documentElement;
if (root.hasAttribute('data-default-entry') && root.dataset.enHome) {
  location.replace(root.dataset.enHome);
}
