chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {

  const currentDomain = (new URL(details.url)).hostname;

  domainIsProhibited(currentDomain).then(
    (resolution) => {
      if (resolution === true) {
        chrome.tabs.remove(details.tabId, function() {
          chrome.tabs.create({
            active: true,
            url: './block.html'
          })
        })
      }
  });

});

async function domainIsProhibited(domain) {

  const promisedDomains = new Promise(function(resolve, reject) {

    chrome.storage.sync.get({savedDomains: []}, (result) => {
      resolve(result);
    });

  });

  const domains = await promisedDomains;

  let found = false;
  domains.savedDomains.forEach((item, i) => {
    if (shouldBlock(item, domain)) {
      found = true;
      return;
    }
  });

  return found;
}

function shouldBlock(entry, currentDomain) {

  return currentDomain === entry.domain && isBlockedNow(entry);


  function isBlockedNow(entry) {
    const presentTime = new Date();

    console.log(entry);

    const blockingFrom = initDateWithTimeString(entry.interval.from);
    const blockingTo = initDateWithTimeString(entry.interval.to);

    return ((blockingFrom.getTime() < presentTime.getTime()) && (presentTime < blockingTo));

    function initDateWithTimeString(time) {
        const date = new Date();
        date.setHours(time.split(':')[0]);
        date.setMinutes(time.split(':')[1]);
        return date;
    }
  }

}
