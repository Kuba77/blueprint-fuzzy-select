import React, { Component, PropTypes } from 'react';
import { Menu, MenuItem } from '@blueprintjs/core';
import FuzzySearch from 'fuzzy-search';

export default class FuzzySelect extends Component {
  static propTypes = {
    haystack: PropTypes.arrayOf(
      React.PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string
      ])
    ).isRequired,
    field: PropTypes.string,
    caseSensitive: PropTypes.bool,
    sort: PropTypes.bool,
    selectOnBlur: React.PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.string
    ]),
    onSelect: PropTypes.func.isRequired,
    onAdd: PropTypes.func,
    onInput: PropTypes.func,
    onSuggestions: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    children: PropTypes.element
  }

  constructor(props, context) {
    super(props, context);

    this.handleFocus = this.handleFocus.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleWindowClick = this.handleWindowClick.bind(this);
    this.handleInput = this.handleInput.bind(this);
  }

  state = {
    input: '',
    selected: null,
    suggestions: [],
    focused: false
  }

  componentDidMount() {
    window.addEventListener('click', this.handleWindowClick, false);
    window.addEventListener('keydown', this.handleKeydown, false);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.handleWindowClick, false);
    window.removeEventListener('keydown', this.handleKeydown, false);
  }

  handleFocus() {
    const { onFocus } = this.props;
    if (onFocus) onFocus();

    this.setState({ input: '', focused: true });
  }

  handleWindowClick(event) {
    const isParent = (reference, target) => (
      target === reference || (target.parentNode && isParent(reference, target.parentNode))
    );

    if (!isParent(this.inputWrapper, event.target)) {
      this.handleBlur('Click');
    }
  }

  handleKeydown(event) {
    if (event.key === 'Tab') {
      this.handleBlur('Tab');
    }
  }

  handleBlur(action) {
    const { field, selectOnBlur, onAdd, onBlur } = this.props;
    let { input } = this.state;
    const { selected, suggestions } = this.state;

    if (onBlur) onBlur();

    if ((selectOnBlur === true || selectOnBlur === action) && input) {
      if (suggestions.length > 0) {
        this.chooseOption(suggestions[0]);
        return;
      } else if (onAdd) {
        this.addOption(input);
        return;
      }
    }

    input = selected ? selected[field] : '';
    this.setState({ input, focused: false });
  }

  handleInput(event) {
    const { onInput, onSuggestions } = this.props;
    const input = event.target.value;
    const suggestions = this.search(input);
    if (onInput) onInput(input);
    if (onSuggestions) onSuggestions(suggestions);

    this.setState({ input, suggestions });
  }

  search(input) {
    const { haystack, field, caseSensitive, sort } = this.props;
    const keys = field ? [field] : [];
    if (haystack.length > 0) {
      this.searcher = new FuzzySearch(haystack, keys, { caseSensitive, sort });
      return this.searcher.search(input);
    }
    return [];
  }

  chooseOption(selected) {
    const { field, onSelect } = this.props;
    if (onSelect) onSelect(selected);

    this.setState({
      selected,
      input: selected[field],
      suggestions: [],
      focused: false
    });
  }

  addOption(input) {
    const { onAdd } = this.props;
    const selected = onAdd(input);

    if (selected) {
      this.setState({
        input,
        selected,
        suggestions: [],
        focused: false
      });
    } else {
      this.setState({
        input: '',
        selected: null,
        suggestions: [],
        focused: false
      });
    }
  }

  render() {
    const { field, onAdd } = this.props;
    const { input, suggestions, focused } = this.state;

    const inputElement = React.cloneElement(
      this.props.children,
      {
        onChange: this.handleInput,
        onFocus: this.handleFocus,
        value: input
      }
    );

    const showNew = onAdd && input;
    const showSuggestions = suggestions.length > 0;

    let suggestionsCount = 0;

    return (
      <div className="input-suggest" ref={(div) => this.inputWrapper = div}>
        {inputElement}
        {focused && (showNew || showSuggestions) &&
          <Menu className="pt-elevation-1">
            {suggestions.map(suggestion =>
              <MenuItem
                key={`suggestion-${suggestionsCount += 1}`}
                text={field ? suggestion[field] : suggestion}
                onClick={() => this.chooseOption(suggestion)}
              />
            )}
            {showNew &&
              <MenuItem
                key="suggestion-add-new"
                text={input}
                iconName="add"
                onClick={() => this.addOption(input)}
              />
            }
          </Menu>
        }
      </div>
    );
  }
}
