$(document).ready(function() {

  $('#blockDomain').click(blockDomain);

  $('.hour input').change(checkHourConstraint);
  $('.minute input').change(checkMinuterConstraint);

  $('.time-input img.rotate0').click(increaseValue);
  $('.time-input img.rotate180').click(decreaseValue);

  initBlockedDomainsTable();

});

function blockDomain() {

  const domainToBlock = $('#domainToBlock').val();

  if (!isValidDomain(domainToBlock)) {

    $('#domainToBlock').css('border', '.25em solid crimson');
    setTimeout(function() {
      $('#domainToBlock').css('border', '.25em solid var(--hex-shadow)')
    }, 750);
    return;
  }

  const timeInterval = new TimeInterval(
    ($('#from .hour input').val() + ':' + $('#from .minute input').val()),
    ($('#to .hour input').val() + ':' + $('#to .minute input').val())
  );

  chrome.storage.sync.get({savedDomains: []}, (result) => {

    const savedDomains = result.savedDomains;

    const existingDomainIndex = 
      savedDomains.findIndex(element => element.domain === domainToBlock);

    if (existingDomainIndex !== -1)
      savedDomains.splice(existingDomainIndex, 1, { domain: domainToBlock, interval: timeInterval });
    else
      savedDomains.push({ domain: domainToBlock, interval: timeInterval });


    chrome.storage.sync.set({savedDomains: savedDomains}, function() {
      $('#domainToBlock').val('');
      initBlockedDomainsTable();
    });


  });
}



function initBlockedDomainsTable() {

  chrome.storage.sync.get({savedDomains: []}, (result) => {

    $('#blockedDomains tbody').html('');

    const savedDomains = result.savedDomains;

    if (savedDomains.length === 0)
      $('#blockedDomains').hide();
    else
      $('#blockedDomains').show();

    savedDomains.forEach((item, i) => {
      $('#blockedDomains tbody').append(
        `
        <tr>
         <td class="discardButton">&times;</td>
         <td class="domain">${item.domain}</td>
         <td>${item.interval.from}</td>
         <td>${item.interval.to}</td>
        </tr>
        `
      );
    });

    $('.discardButton').click(removeDomain);
  });


}

function removeDomain(event) {

  const domainToRemove = $(event.target).siblings('.domain')[0].innerHTML;

  chrome.storage.sync.get({savedDomains: []}, (result) => {

    const savedDomains =
      result.savedDomains.filter((domainEntry) => domainEntry.domain !== domainToRemove);

    chrome.storage.sync.set({savedDomains: savedDomains}, function() {
      initBlockedDomainsTable();
    })
  });
}

function checkHourConstraint(event) {

  const minutesElement = $($(event.target).parent().next().children()[0]);

  if (new Number(event.target.value) >= 24) {
    $(event.target).val('24');
    minutesElement.prop('disabled', true);
  }

  if (new Number(event.target.value) < 0) {
    $(event.target).val('00');
  }

  if (new Number(event.target.value) < 10)
    $(event.target).val('0' + new Number(event.target.value));
}

function checkMinuterConstraint(event) {

  const hoursElement = $($(event.target).parent().prev().children()[0]);

  if (new Number(hoursElement.val()).valueOf() === 24)
    $(event.target).val('00');

  if (new Number(event.target.value) > 59)
    $(event.target).val('59');

  if (new Number(event.target.value) < 0) {
    $(event.target).val('00');
    return;
  }

  if (new Number(event.target.value) < 10)
    $(event.target).val('0' + $(event.target).val());
}

function isValidDomain(domain) {

  if (domain.length === 0)
    return false;

  const match =
    domain.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);

  return match !== null;
}

function increaseValue(event) {

  const target = $(event.target).siblings('input')[0];
  target.stepUp();

  if ($(target).val() < 10)
    $(target).val('0' + $(target).val());
}

function decreaseValue(event) {
  const target = $(event.target).siblings('input')[0];
  target.stepDown();

  if ($(target).val() < 10)
    $(target).val('0' + $(target).val())
}

class TimeInterval {

  constructor(from='00:00', to='24:00') {
    this.from = from;
    this.to = to;
  }

  isValid() {
    return this.isValidTime(from) && this.isValidTime(to);
  }

  toString() {
    return 'From: ' + this.from + ' to ' + this.to;
  }
}
