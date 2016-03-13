import utils from '../utils';

export default class Filters {
  constructor(maptable) {
    this.maptable = maptable;
    this.criteria = [];

    this.container = document.createElement('div');
    this.maptable.node.appendChild(this.container);

    this.node = document.createElement('div');
    this.node.setAttribute('id', 'mt-filters');
    this.node.setAttribute('class', 'panel panel-default');

    // -- Filters Header

    const filtersHeaderNode = document.createElement('div');
    filtersHeaderNode.setAttribute('class', 'panel-heading');

    const filtersResetNode = document.createElement('button');
    filtersResetNode.setAttribute('id', 'mt-filters-reset');
    filtersResetNode.setAttribute('class', 'btn btn-default btn-xs pull-right');
    filtersResetNode.style.display = 'none';
    filtersResetNode.style.marginLeft = 5;
    filtersResetNode.innerText = '↺ Reset';
    filtersResetNode.addEventListener('click', this.reset);
    filtersHeaderNode.appendChild(filtersResetNode);

    const filtersTitleNode = document.createElement('h3');
    filtersTitleNode.setAttribute('class', 'panel-title');
    filtersTitleNode.appendChild(document.createTextNode('Filters'));
    filtersHeaderNode.appendChild(filtersTitleNode);

    this.node.appendChild(filtersHeaderNode);

    // -- Filters Content
    const filtersBodyNode = document.createElement('div');
    filtersBodyNode.setAttribute('id', 'mt-filters-content');
    filtersBodyNode.setAttribute('class', 'panel-body');

    const filtersElementsNode = document.createElement('div');
    filtersElementsNode.setAttribute('id', 'mt-filters-elements');
    filtersBodyNode.appendChild(filtersElementsNode);

    const filtersNewNode = document.createElement('a');
    filtersNewNode.setAttribute('id', 'mt-filters-new');
    filtersNewNode.innerText = '+ New filter';
    filtersNewNode.addEventListener('click', this.add.bind(this));
    filtersBodyNode.appendChild(filtersNewNode);

    this.node.appendChild(filtersBodyNode);

    // -- Appending to main node
    this.maptable.node.appendChild(this.node);
  }

  add() {
    const possibleFilters = this.getPossibleFilters();

    if (possibleFilters.length === 0) {
      return;
    }
    const filterName = possibleFilters[0].key;
    this.create(filterName);
  }

  create(filterName, replaceNode) {
    const rowNode = this.buildRow(filterName);
    if (replaceNode) {
      replaceNode.parentNode.replaceChild(rowNode, replaceNode);
    } else {
      this.container.appendChild(rowNode);
    }
    this.criteria.push(filterName);
    if (this.container.style.display === 'none') {
      this.toggle();
    }
  }

  remove(filterName) {
    const rowNode = document.querySelector(`[data-mt-filter-name="${filterName}"]`);
    rowNode.remove();
    const filterIndex = this.criteria.indexOf(filterName);
    this.criteria.splice(filterIndex, 1);
  }

  reset() {
    this.criteria = [];
    this.container.innerHTML = '';
    this.refresh();
    this.maptable.map.reset();
  }

  getDescription() {
    const outputArray = [];

    const filtersChildren = this.container.childNodes;

    for (let i = 0; i < filtersChildren.length; i++) {
      const element = filtersChildren[i];
      const filterName = element.querySelector('.mt-filter-name').value;

      const filterOptions = this.maptable.columnDetails[filterName];

      let line = '';

      if (filterOptions.type === 'number' || filterOptions.type === 'custom') {
        const filterRangeSelect = element.querySelector('.mt-filter-range');
        if (filterRangeSelect.value !== 'any') {
          if (filterRangeSelect.value === 'BETWEEN') {
            const filterValueMin = element.querySelector('.mt-filter-value-min').value;
            const filterValueMax = element.querySelector('.mt-filter-value-max').value;
            if (filterValueMin === '' || filterValueMax === '') continue;
            line += `${filterOptions.title} is between `;
            line += `<tspan font-weight="bold">${filterValueMin}</tspan> and
              <tspan font-weight="bold">${filterValueMax}</tspan>`;
          } else {
            const filterValue = element.querySelector('.mt-filter-value').value;
            if (filterValue === '') continue;
            line += `${filterOptions.title} is `;
            line += filterRangeSelect.options[filterRangeSelect.selectedIndex].text;
            line += `<tspan font-weight="bold">${filterValue}</tspan>`;
          }
        }
      } else if (filterOptions.type === 'field' || filterOptions.type === 'dropdown') {
        const filterValue = element.querySelector('.mt-filter-value').value;
        if (filterValue === '') continue;
        const separatorWord = (filterOptions.type === 'field') ? 'contains' : 'is';
        line += `${filterOptions.title} ${separatorWord}
          <tspan font-weight="bold">${filterValue}</tspan>`;
      }
      outputArray.push(line);
    }
    return outputArray.join(', ');
  }

  buildRow(filterName) {
    const self = this;

    const possibleFilters = this.getPossibleFilters();

    const filterOptions = this.maptable.columnDetails[filterName];

    const rowNode = document.createElement('div');
    rowNode.setAttribute('class', 'mt-filter-row');
    rowNode.setAttribute('data-mt-filter-name', filterName);

    // Button to remove filter
    const minusButton = document.createElement('button');
    minusButton.setAttribute('class', 'btn btn-default pull-right');
    minusButton.setAttribute('data-mt-filter-btn-minus', null);
    minusButton.innerText = '– Remove this filter';
    minusButton.addEventListener('click', () => {
      filterName = rowNode.querySelector('.mt-filters-dropdown').value;
      this.remove(filterName);
    });
    rowNode.appendChild(minusButton);

    // Filters separator "AND"
    const filterSeparator = document.createElement('span');
    filterSeparator.setAttribute('class', 'mt-filter-and');
    filterSeparator.innerText = 'And ';
    rowNode.appendChild(filterSeparator);

    // Filter name select
    const filterNameSelect = document.createElement('select');
    filterNameSelect.setAttribute('class', 'mt-filter-name form-control form-control-inline');
    utils.appendOptions(filterNameSelect, possibleFilters.map(f => {
      return { text: f.title, value: f.key };
    }));
    filterNameSelect.value = filterName;

    filterNameSelect.addEventListener('change', function () {
      const oldFilterName = this.parentNode.getAttribute('data-mt-filter-name');
      const newFilterName = this.value;
      self.create(newFilterName, this.parentNode);
      self.remove(oldFilterName);
      self.refresh();
    });
    rowNode.appendChild(filterNameSelect);

    // Filter verb
    const filterVerb = document.createElement('span');
    filterVerb.innerText = (filterOptions.type === 'field') ? ' contains ' : ' is ';
    rowNode.appendChild(filterVerb);

    // Filter range
    let filterRange = null;
    if (filterOptions.type !== 'field' && filterOptions.type !== 'dropdown') {
      filterRange = document.createElement('select');
      filterRange.setAttribute('class', 'mt-filter-range form-control form-control-inline');
      utils.appendOptions(filterRange, ['any', '=', '≠', '<', '>', '≤', '≥', 'BETWEEN'].map(v => {
        return { text: v, value: v };
      }));
      filterRange.addEventListener('change', function () {
        self.handleRangeChange(this);
      });
      rowNode.appendChild(filterRange);

      // Little space:
      rowNode.appendChild(document.createTextNode(' '));
    }

    // Filter value
    const filterValue = document.createElement('div');
    filterValue.style.display = 'inline-block';
    filterValue.setAttribute('class', 'mt-filters-value');

    if (filterOptions.type === 'number' || filterOptions.type === 'custom') {
      ['min', 'max'].forEach((val, i) => {
        const filterInput = document.createElement('input');
        filterInput.setAttribute('class',
          `form-control form-control-inline mt-filter-value-${val}`);
        if (filterOptions.type) {
          filterInput.setAttribute('type', filterOptions.type);
        } else {
          filterInput.setAttribute('type', 'text');
        }
        filterInput.addEventListener('keyup', this.refresh.bind(this));
        filterInput.addEventListener('change', this.refresh.bind(this));
        filterValue.appendChild(filterInput);
        if (i === 0) {
          // AND
          const filterValueAnd = document.createElement('span');
          filterValueAnd.setAttribute('class', 'mt-filter-value-and');
          filterValueAnd.innerText = ' and ';
          filterValue.appendChild(filterValueAnd);
        }
      });
    } else if (filterOptions.type === 'field') {
      const filterInput = document.createElement('input');
      filterInput.setAttribute('class', 'form-control form-control-inline mt-filter-value');
      filterInput.setAttribute('type', 'text');
      filterInput.addEventListener('keyup', this.refresh.bind(this));
      filterInput.addEventListener('change', this.refresh.bind(this));
      filterValue.appendChild(filterInput);
    } else if (filterOptions.type === 'dropdown') {
      const filterSelect = document.createElement('select');
      filterSelect.setAttribute('class', 'form-control form-control-inline mt-filter-value');

      const uniqueValues = d3.nest().key(d => d[filterName])
        .sortKeys(d3.ascending)
        .entries(this.maptable.rawData);

      // TODO map uniqueValues
      utils.appendOptions(filterSelect, [{ text: 'Any', value: '' }].concat(uniqueValues));

      filterSelect.addEventListener('change', this.refresh.bind(this));
      filterValue.appendChild(filterSelect);
    }

    rowNode.appendChild(filterValue);

    // We trigger it here to handle the value of the filter range
    if (filterRange) {
      this.changeRange(filterRange);
    }

    return rowNode;
  }

  changeRange(filterRange) {
    const rowNode = filterRange.parentNode;
    if (filterRange.value === 'any') {
      rowNode.querySelector('.mt-filter-value').style.display = 'none';
    } else {
      rowNode.querySelector('.mt-filter-value').style.display = 'inline-block';
      if (filterRange.value === 'BETWEEN') {
        rowNode.querySelector('.mt-filter-value-min').style.display = 'inline-block';
        rowNode.querySelector('.mt-mt-filter-value-max').style.display = 'inline-block';
      } else {
        rowNode.querySelector('.mt-filters-value-max').style.display = 'none';
        rowNode.querySelector('.mt-filters-value-and').style.display = 'none';
      }
    }
  }

  getPossibleFilters(except) {
    return Object.keys(this.maptable.columnDetails)
      .map(k => Object.assign({ key: k }, this.maptable.columnDetails[k]))
      .filter(v => {
        return (except && except === v.key) ||
        (this.criteria.indexOf(v.key) === -1 && v.type && v.type !== 'virtual');
      });
  }

  filterData() {
    this.data = this.maptable.rawData.filter(d => {
      const rowNodes = document.querySelectorAll('.mt-filters-row');
      for (let i = 0; i < rowNodes.length; i++) {
        const rowNode = rowNodes[i];
        const filterName = rowNode.getAttribute('data-mt-filter-name');
        const filterOptions = this.maptable.columnDetails[filterName];
        const fmt = filterOptions.dataFormat; // shortcut

        if (filterOptions.type === 'dropdown') {
          const filterValue = rowNode.querySelector('.mt-filters-value').value;
          if (filterValue === '') continue;
          if (d[filterName] !== filterValue) return false;
        } else if (filterOptions.type === 'field') {
          const filterValue = rowNode.querySelector('.mt-filters-value').value;
          if (filterValue === '') continue;
          return (d[filterName].toLowerCase().indexOf(filterValue.toLowerCase()) !== -1);
        } else if (filterOptions.type === 'number' || filterOptions.type === 'custom') {
          const filterRange = rowNode.querySelector('.mt-filter-range').value;
          if (filterRange === 'BETWEEN') {
            const filterValueMin = rowNode.querySelector('.mt-filter-value-min').value;
            const filterValueMax = rowNode.querySelector('.mt-filters-value-max').value;
            if (filterValueMin === '' || filterValueMax === '') continue;

            if (filterOptions.type === 'custom' && fmt) {
              if (fmt) {
                if (fmt(d[filterName]) < fmt(filterValueMin) ||
                  fmt(d[filterName]) > fmt(filterValueMax)) {
                  return false;
                }
              }
            } else {
              if (parseInt(d[filterName], 10) < parseInt(filterValueMin, 10) ||
                  parseInt(d[filterName], 10) > parseInt(filterValueMax, 10)) {
                return false;
              }
            }
          } else {
            const filterValue = rowNode.querySelector('.mt-filters-value').value;
            if (filterValue === '') continue;
            if (filterOptions.type === 'custom' && fmt) {
              if (!utils.rangeToBool(fmt(d[filterName]), filterRange, fmt(filterValue))) {
                return false;
              }
            } else {
              if (!utils.rangeToBool(d[filterName], filterRange, filterValue)) {
                return false;
              }
            }
          }
        }
      }
      return true;
    });
  }

  refresh() {
    // update dropdown
    const filterNameSelects = document.querySelectorAll('.mt-filter-name');
    for (let i = 0; i < filterNameSelects.length; i++) {
      const filterNameSelect = filterNameSelects[i];
      const filterName = filterNameSelect.value;
      const possibleFilters = this.getPossibleFilters(filterName);
      filterNameSelect.innerHTML = '';
      utils.appendOptions(filterNameSelect, possibleFilters.map(f => {
        return { text: f.title, value: f.key };
      }));
      filterNameSelect.value = filterName;
    }

    // Hide the first "And"
    if (document.querySelectorAll('.mt-filters-and').length > 0) {
      document.querySelectorAll('.mt-filters-and')[0].style.visibility = 'hidden';
    }

    // Check if we reached the maximum of allowed filters
    const disableNewFilter = (!this.getPossibleFilters().length);
    document.getElementById('mt-filters-new').disabled = disableNewFilter;

    const minusButtons = document.querySelectorAll('[data-mt-filter-btn-minus]');
    for (let i = 0; i < minusButtons.length; i++) {
      minusButtons[i].disabled = disableNewFilter;
    }
  }

  toggle() {
    if (this.container.style.display === 'none') {
      this.container.style.display = 'block';
      if (this.criteria.length === 0) {
        this.add();
      }
    } else {
      this.container.style.display = 'none';
    }
  }
}
