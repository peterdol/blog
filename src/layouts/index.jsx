import React from 'react';
import Helmet from 'react-helmet';
import '../assets/scss/init.scss';
import 'prismjs/themes/prism-coy.css';

class Layout extends React.Component {
  render() {
    const {children} = this.props;

    return (
      <div className="layout">
        <Helmet defaultTitle="Blog by Peter Dol"/> {children()}
      </div>
    );
  }
}

export default Layout;
