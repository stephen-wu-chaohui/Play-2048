const { computed, watch, reactive } = Vue;

function LocalStoragePersist(initialValue, itemName) {
  const savedValue = localStorage.getItem(itemName);
  try {
    const savedSettings = JSON.parse(savedValue);
    if (savedSettings) {
      initialValue = savedSettings;
    }
  } catch (e) {
    console.log(e, { savedValue });
  }

  const persistedObject = reactive(initialValue);

  watch(persistedObject, () => {
    localStorage.setItem(itemName, JSON.stringify(persistedObject));
  }, { deep: true });

  return persistedObject;
}
