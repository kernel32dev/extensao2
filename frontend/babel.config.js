module.exports = {
    presets: [
        [ "@babel/preset-env", { modules: false } ],
        [ "@babel/preset-typescript", { isTSX: true, allExtensions: true, dts: true } ],
    ],
    plugins: [
        "babel-plugin-transform-line",
        "babel-plugin-transform-dirname-filename",
        "@babel/plugin-transform-class-properties",
        "@babel/plugin-transform-object-rest-spread",
        [
            "@babel/plugin-transform-react-jsx",
            {
                runtime: "classic",
                pragma: "window.jsx",
                pragmaFrag: 'null'
            }
        ],
    ],
};
