import React from 'react';
import Helmet from 'react-helmet';
import 'prismjs/themes/prism-coy.css';
import '../assets/scss/init.scss';


class Layout extends React.Component {
  render() {
    const { children } = this.props;

    return (
      <div className="layout">
        <Helmet defaultTitle="Blog by Peter Dol" /> {children()}
      </div>
    );
  }
}

export default Layout;
