import React, { PropTypes } from 'react';
import { History } from 'react-router';
import { contain } from 'thundercats-react';
import debugFactory from 'debug';
import { getDefaults } from '../utils';

import {
  inHTMLData,
  uriInSingleQuotedAttr
} from 'xss-filters';

import {
  Button,
  Col,
  Input,
  Row,
  Panel
} from 'react-bootstrap';

import {
  isAscii,
  isEmail,
  isMobilePhone,
  isURL
} from 'validator';

const debug = debugFactory('freecc:jobs:newForm');

const checkValidity = [
  'position',
  'locale',
  'description',
  'email',
  'phone',
  'url',
  'logo',
  'company',
  'highlight'
];

function formatValue(value, validator, type = 'string') {
  const formated = getDefaults(type);
  if (validator && type === 'string') {
    formated.valid = validator(value);
  }
  if (value) {
    formated.value = value;
    formated.bsStyle = formated.valid ? 'success' : 'error';
  }
  return formated;
}

function isValidURL(data) {
  return isURL(data, { 'require_protocol': true });
}

function isValidPhone(data) {
  return isMobilePhone(data, 'en-US');
}

function makeRequired(validator) {
  return (val) => !!val && validator(val);
}

export default contain({
    actions: 'jobActions',
    store: 'jobsStore',
    map({ form = {} }) {
      const {
        position,
        locale,
        description,
        email,
        phone,
        url,
        logo,
        company,
        highlight
      } = form;
      return {
        position: formatValue(position, makeRequired(isAscii)),
        locale: formatValue(locale, makeRequired(isAscii)),
        description: formatValue(description, makeRequired(isAscii)),
        email: formatValue(email, makeRequired(isEmail)),
        phone: formatValue(phone, isValidPhone),
        url: formatValue(url, isValidURL),
        logo: formatValue(logo, isValidURL),
        company: formatValue(company, makeRequired(isAscii)),
        highlight: formatValue(highlight, null, 'bool')
      };
    },
    subscribeOnWillMount() {
      return typeof window !== 'undefined';
    }
  },
  React.createClass({
    displayName: 'NewJob',

    propTypes: {
      jobActions: PropTypes.object,
      position: PropTypes.object,
      locale: PropTypes.object,
      description: PropTypes.object,
      email: PropTypes.object,
      phone: PropTypes.object,
      url: PropTypes.object,
      logo: PropTypes.object,
      company: PropTypes.object,
      highlight: PropTypes.object
    },

    mixins: [History],

    handleSubmit(e) {
      e.preventDefault();
      const props = this.props;
      let valid = true;
      checkValidity.forEach((prop) => {
        // if value exist, check if it is valid
        if (props[prop].value && props[prop].type !== 'boolean') {
          valid = valid && !!props[prop].valid;
        }
      });

      if (!valid) {
        debug('form not valid');
        return;
      }

      const {
        position,
        locale,
        description,
        email,
        phone,
        url,
        logo,
        company,
        highlight,
        jobActions
      } = this.props;

      // sanitize user output
      const jobValues = {
        position: inHTMLData(position.value),
        locale: inHTMLData(locale.value),
        description: inHTMLData(description.value),
        email: inHTMLData(email.value),
        phone: inHTMLData(phone.value),
        url: uriInSingleQuotedAttr(url.value),
        logo: uriInSingleQuotedAttr(logo.value),
        company: inHTMLData(company.value),
        highlight: !!highlight.value
      };

      const job = Object.keys(jobValues).reduce((accu, prop) => {
        if (jobValues[prop]) {
          accu[prop] = jobValues[prop];
        }
        return accu;
      }, {});

      job.postedOn = new Date();
      debug('job sanitized', job);
      jobActions.saveForm(job);

      this.history.pushState(null, '/jobs/new/preview');
    },

    componentDidMount() {
      const { jobActions } = this.props;
      jobActions.getSavedForm();
    },

    handleChange(name, { target: { value } }) {
      const { jobActions: { handleForm } } = this.props;
      handleForm({ [name]: value });
    },

    render() {
      const {
        position,
        locale,
        description,
        email,
        phone,
        url,
        logo,
        company,
        highlight,
        jobActions: { handleForm }
      } = this.props;
      const { handleChange } = this;
      const labelClass = 'col-sm-offset-1 col-sm-2';
      const inputClass = 'col-sm-6';

      return (
        <div>
          <Row>
            <Col
              md={ 10 }
              mdOffset={ 1 }>
              <Panel className='text-center'>
                <h1>Create Your Job Post</h1>
                <form
                  className='form-horizontal'
                  onSubmit={ this.handleSubmit }>

                  <div className='spacer'>
                    <h2>First, tell us about the position</h2>
                  </div>
                  <Input
                    bsStyle={ position.bsStyle }
                    label='Job Title'
                    labelClassName={ labelClass }
                    onChange={ (e) => handleChange('position', e) }
                    placeholder='e.g. Full Stack Developer, Front End Developer, etc.'
                    required={ true }
                    type='text'
                    value={ position.value }
                    wrapperClassName={ inputClass } />
                  <Input
                    bsStyle={ locale.bsStyle }
                    label='Location'
                    labelClassName={ labelClass }
                    onChange={ (e) => handleChange('locale', e) }
                    placeholder='e.g. San Francisco, Remote, etc.'
                    required={ true }
                    type='text'
                    value={ locale.value }
                    wrapperClassName={ inputClass } />
                  <Input
                    bsStyle={ description.bsStyle }
                    label='Description'
                    labelClassName={ labelClass }
                    onChange={ (e) => handleChange('description', e) }
                    required={ true }
                    rows='10'
                    type='textarea'
                    value={ description.value }
                    wrapperClassName={ inputClass } />

                  <div className='divider'>
                    <h2>Tell us about your organization</h2>
                  </div>
                  <Input
                    bsStyle={ company.bsStyle }
                    label='Company Name'
                    labelClassName={ labelClass }
                    onChange={ (e) => handleChange('company', e) }
                    type='text'
                    value={ company.value }
                    wrapperClassName={ inputClass } />
                  <Input
                    bsStyle={ email.bsStyle }
                    label='Email'
                    labelClassName={ labelClass }
                    onChange={ (e) => handleChange('email', e) }
                    placeholder='you@yourcompany.com'
                    required={ true }
                    type='email'
                    value={ email.value }
                    wrapperClassName={ inputClass } />
                  <Input
                    bsStyle={ phone.bsStyle }
                    label='Phone'
                    labelClassName={ labelClass }
                    onChange={ (e) => handleChange('phone', e) }
                    placeholder='555-867-5309'
                    type='tel'
                    value={ phone.value }
                    wrapperClassName={ inputClass } />
                  <Input
                    bsStyle={ url.bsStyle }
                    label='URL'
                    labelClassName={ labelClass }
                    onChange={ (e) => handleChange('url', e) }
                    placeholder='http://freecodecamp.com'
                    type='url'
                    value={ url.value }
                    wrapperClassName={ inputClass } />
                  <Input
                    bsStyle={ logo.bsStyle }
                    label='Logo'
                    labelClassName={ labelClass }
                    onChange={ (e) => handleChange('logo', e) }
                    placeholder='http://freecatphotoapp.com/logo.png'
                    type='url'
                    value={ logo.value }
                    wrapperClassName={ inputClass } />

                  <div className='divider'>
                    <h2>Highlight your listing to make it stand out</h2>
                  </div>
                  <Input
                    checked={ highlight.value }
                    label="&thinsp;&thinsp;&thinsp;Sure - I'll pay $50 more for that."
                    labelClassName={ 'col-sm-offset-1 col-sm-6'}
                    onChange={
                      ({ target: { checked } }) => handleForm({
                        highlight: !!checked
                      })
                    }
                    type='checkbox' />
                  <div className='spacer' />
                  <Row>
                    <Col
                      lg={ 6 }
                      lgOffset={ 3 }>
                      <Button
                        block={ true }
                        bsSize='large'
                        bsStyle='primary'
                        type='submit'>
                        Preview My Ad
                      </Button>
                    </Col>
                  </Row>
                </form>
              </Panel>
            </Col>
          </Row>
        </div>
      );
    }
  })
);
