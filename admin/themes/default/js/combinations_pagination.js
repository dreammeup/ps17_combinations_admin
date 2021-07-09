var selectorsMap = null;
var $jsCombinationsList = $('.js-combinations-list');
var $paginationContainer = $('#combinations-pagination');
var startingPage = null;
var currentURL = window.location.href;
var refreshImagesUrl = $jsCombinationsList
      .attr('data-action-refresh-images')
      .replace(/form-images\/\d+/, 'form-images/' + $jsCombinationsList.data('id-product'));
var idsCount = 0;
var ids_product_attribute = $jsCombinationsList.data('all-ids-product-attribute').toString().split(',');

$(document).ready(function() {
    setSelectorsMap();
    initPagination();
    paginate(startingPage);
});

function initPagination() {
    $paginationContainer.on('click', selectorsMap.pageLink, (e) => {
      paginate(Number($(e.currentTarget).data('page')));
    });
    $paginationContainer.find(selectorsMap.jumpToPageInput).keydown((e) => {
        if (e.which === 13) {
            e.preventDefault();
            const page = getValidPageNumber(Number(e.currentTarget.value));
            paginate(page);
        }
    });
    $paginationContainer.on('change', selectorsMap.limitSelect, () => {
        paginate(1);
    });

    $('#js-bulk-combinations-total').bind('DOMSubtreeModified', function () {
      $(selectorsMap.limitSelect).trigger('change');
    });
}

function showLoader()
{
  $paginationContainer.find('svg').css("display", "block");
  $paginationContainer.css("margin-top", "120px");
}

function hideLoader()
{
  $paginationContainer.find('svg').css("display", "none");
  $paginationContainer.css("margin-top", "0");
}

  /**
   * @param {Number} page
   */
async function paginate(page) {
    currentPage = page;
    if (currentPage == null) {
      currentPage = 1;
    }
    if (page != null) {
      $('html, body').stop().animate({
        scrollTop: parseInt($jsCombinationsList.offset().top)-200
      }, 500);
    }
    const limit = getLimit();
    const offset = calculateOffset(currentPage, limit);
    const total = parseInt($('#js-bulk-combinations-total').text());
    $(selectorsMap.jumpToPageInput).val(currentPage);
    countPages(total);
    refreshButtonsData(currentPage);
    refreshInfoLabel(currentPage, total);

    toggleTargetAvailability(selectorsMap.firstPageItem, currentPage > 1);
    toggleTargetAvailability(selectorsMap.previousPageItem, currentPage > 1);
    toggleTargetAvailability(selectorsMap.nextPageItem, currentPage < pagesCount);
    toggleTargetAvailability(selectorsMap.lastPageItem, currentPage < pagesCount);

    // on affiche les bonnes déclinaisons
    var newUrl = getCombinationsUrl(offset,limit);
    if (page != null) {
        $jsCombinationsList.html('');
        showLoader();
        // on va chercher la nouvelle page
        $.ajax({
            method: 'GET',
            url: newUrl
         }).done((response) => {
            $jsCombinationsList.html(response);
            $.get(refreshImagesUrl).then(function(response) {
                if (idsCount !== 0) {
                    refreshImagesCombination(response, ids_product_attribute.slice(offset, parseInt(offset)+parseInt(limit)));
                    $('#accordion_combinations tr').each(function() {
                        $(this).fadeIn(1000);
                    })
                    hideLoader();
                }
              });
        });
    }
}

  /**
   * @param page
   * @param limit
   *
   * @returns {Number}
   */
function calculateOffset(page, limit) {
    return (page - 1) * limit;
  }

    /**
   * @param {Number} total
   *
   * @private
   */
function countPages(total) {
    pagesCount = Math.ceil(total / getLimit());
    const lastPageItem = $paginationContainer.find(selectorsMap.lastPageBtn);
    lastPageItem.data('page', pagesCount);
    lastPageItem.text(pagesCount);
}

  /**
   *
   * @param page
   *
   * @returns {Number}
   */
function getValidPageNumber(page) {
    if (page > pagesCount) {
      return pagesCount;
    }

    if (page < 1) {
      return 1;
    }

    return page;
  }

  /**
   * @param {String} targetSelector
   * @param {Boolean} enable
   *
   * @private
   */
function toggleTargetAvailability(targetSelector, enable) {
    const target = $paginationContainer.find(targetSelector);

    if (enable) {
      target.removeClass('disabled');
    } else {
      target.addClass('disabled');
    }
  }

function getLimit()
{
    return $paginationContainer.find(selectorsMap.limitSelect).val();
}

function refreshInfoLabel(page, total) {
    const infoLabel = $paginationContainer.find(selectorsMap.paginationInfoLabel);
    const limit = getLimit();
    const from = page === 1 ? 1 : Math.round((page - 1) * limit);
    const to = page === pagesCount ? total : Math.round(page * limit);
    const modifiedInfoText = infoLabel
      .data('pagination-info')
      .replace(/%from%/g, from)
      .replace(/%to%/g, to)
      .replace(/%total%/g, total)
      .replace(/%current_page%/g, page)
      .replace(/%page_count%/g, pagesCount);

    infoLabel.text(modifiedInfoText);
}

  /**
   * @param {Number} page
   *
   * @private
   */
function refreshButtonsData(page) {
    $paginationContainer.find(selectorsMap.nextPageBtn).data('page', page + 1);
    $paginationContainer.find(selectorsMap.previousPageBtn).data('page', page - 1);
    $paginationContainer.find(selectorsMap.lastPageBtn).data('page', pagesCount);
}

function setSelectorsMap() {
    if (selectorsMap) {
        selectorsMap = selectorsMap;
        return;
    }

    selectorsMap = {
        jumpToPageInput: 'input[name="paginator-jump-page"]',
        firstPageBtn: 'button.page-link.first',
        firstPageItem: 'li.page-item.first',
        nextPageBtn: 'button.page-link.next',
        nextPageItem: 'li.page-item.next',
        previousPageBtn: 'button.page-link.previous',
        previousPageItem: 'li.page-item.previous',
        lastPageItem: 'li.page-item.last',
        lastPageBtn: 'button.page-link.last',
        pageLink: 'button.page-link',
        limitSelect: '#paginator-limit',
        paginationInfoLabel: '#pagination-info',
    };
}

function getCombinationsUrl(offset, limit) {
    idsCount = ids_product_attribute.slice(offset, parseInt(offset)+parseInt(limit));
    const $numbers = ids_product_attribute.slice(offset, parseInt(offset)+parseInt(limit)).join('-');
    if ($numbers.length === 0) {
      return false;
    }


    return $jsCombinationsList
      .data('combinations-url')
      .replace(
        ':numbers',
        $numbers
    );
};


function refreshImagesCombination(combinationsImages, idsProductAttribute){
$.each(idsProductAttribute, function (index, value) {
        const $combinationElem = $('.combination[data="' + value + '"]');
        const $index = $combinationElem.attr('data-index');
        let $imagesElem = $combinationElem.find('.images');
        let html = '';

        if (0 === $imagesElem.length) {
        $imagesElem = $('#combination_' + $index + '_id_image_attr');
        }

        $.each(combinationsImages[value], function(key, image) {
        html += `<div class="product-combination-image ${(image.id_image_attr ? 'img-highlight' : '')}">
            <input type="checkbox" name="combination_${$index}[id_image_attr][]" value="${image.id}" ${(image.id_image_attr ? 'checked="checked"' : '')}>
            <img src="${image.base_image_url}-small_default.${image.format}" alt="" />
        </div>`;
        });
        $imagesElem.html(html);
        $combinationElem.fadeIn(1000);
    });

    refreshDefaultImage();
};

function refreshDefaultImage() {
    const productCoverImageElem = $('#product-images-dropzone').find('.iscover');
    let productDefaultImageUrl = null;

    /** get product cover image */
    if (productCoverImageElem.length === 1) {
        let imgElem = productCoverImageElem.parent().find('.dz-image');

        /** Dropzone.js workaround : If this is a fresh upload image, look up for an img, else find a background url */
        if (imgElem.find('img').length) {
        productDefaultImageUrl = imgElem.find('img').attr('src');
        } else {
        productDefaultImageUrl = imgElem.css('background-image')
            .replace(/^url\(["']?/, '')
            .replace(/["']?\)$/, '');
        }
    }

    $.each($('#form .combination-form'), function(key, elem) {
        let defaultImageUrl = productDefaultImageUrl;

        /** get first selected image */
        const defaultImageElem = $(elem).find('.product-combination-image input:checked:first');
        if (defaultImageElem.length === 1) {
        defaultImageUrl = defaultImageElem.parent().find('img').attr('src');
        }

        if (defaultImageUrl) {
        var img = '<img src="' + defaultImageUrl + '" class="img-responsive" />';
        $('#attribute_' + $(elem).attr('data')).find('td.img').html(img);
        }
    });
};