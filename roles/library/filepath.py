#!/usr/bin/env python3

import os
from urllib.parse import quote

class FilterModule(object):
    def filters(self):
        return {
            'filepath': self.filepath
        }

    def filepath(self, path, *filename):
        #
        # path: a string or a list of string that contains successive parts
        #       of the path. Nul or empty parts are removed
        # filename: the optionnal filename to be used after the path. It may
        #       be specified using multiple args to be concatenate (useful
        #       when building dynamic names in ansible/jinja templates)
        #
        '''build a gitlab filepath given `path' and `filename'.'''

        if path is not None:
            if not isinstance(path, list):
                path = [path]
            path = list(filter(None, path))
            if path:
                path = os.path.normpath(os.path.join(path[0], *path[1:]))

        if filename:
            filename = ''.join(list(filter(None, filename)))

        if path and filename:
            path = os.path.join(path, filename)
        elif filename:
            path = filename

        if path:
            return quote(path, safe='')

        return None
