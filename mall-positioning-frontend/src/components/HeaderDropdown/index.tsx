import { Dropdown } from 'antd';
// @ts-ignore
import type { DropDownProps, MenuProps } from 'antd/es/dropdown';
import classNames from 'classnames';
import React, { useState, useEffect, useRef } from'react';
import styles from './index.less';

export type HeaderDropdownProps = {
  overlayClassName?: string;
  menu: MenuProps;
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topCenter' | 'topRight' | 'bottomCenter';
} & Omit<DropDownProps, 'overlay'>;

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({
                                                         overlayClassName: cls,
                                                         menu,
                                                         ...restProps
                                                       }) => (
  <Dropdown
    menu={menu}
    overlayClassName={classNames(styles.container, cls)}
    getPopupContainer={(target) => target.parentElement || document.body}
    {...restProps}
  />
);

export default HeaderDropdown;
