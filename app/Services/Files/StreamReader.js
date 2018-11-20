const fs = require('fs');

/**
 * @class StreamReader
 * use this class when you want to read a very large file
 * that's too big to fit in RAM
 * -> it's the case of EDDB systems' dump (in csv)
 */
module.exports = class StreamReader {
    constructor() {
        this.windows_separator = '\r\n';
        this.unix_separator = '\n';

        this.separator = this.unix_separator;
    }

    /**
     * @param {String} type separator windows or unix
     */
    setSeparator(type) {
        if (type === 'windows') this.separator = this.windows_separator;
        else if (type === 'unix') this.separator === this.unix_separator;
        else throw new Error(`StreamReader:01:bad separator argument`);
    }

    /**
     * @public
     * Read a very long file by a chunk of lines
     * @param {String} path absolute path to file
     * @param {Number} number or char, seems that mini is 3K
     * @param {Function} cb that returns a promise -> will be played whenever
     * a chunk is read
     * @return {Promise<Null>} resolved when end of file is reached
     */
    readFileLinesByChunk(path, chunk_size, cb) {
        return new Promise((resolve, reject) => {
            let stream = fs.createReadStream(path);

            this._readFileByChunks(stream, chunk_size, cb, (err, res) => {
                resolve();
            })
        });
    }

    /**
    * @private
    * Inner workings of reading a huge file by chunks of lines
    * @param {Streamn} stream readable
    * @param {Integer} chunk_size size in bytes of the chunk
    * @param {Function<Promise>} chunk_prom promise played when each chunk is read
    * @param {Function} end_cb end of file callback
    */
    _readFileByChunks(stream, chunk_size, chunk_prom, end_cb) {
        let data = '';
        stream.on('data', output => {
            data += output.toString();
            if (data.length > chunk_size) {
                stream.pause();
                let spl = data.split(this.separator);
                let remainder = spl.pop() || "";
                chunk_prom(spl).then(() => {
                    data = remainder;
                    stream.resume();
                });
            }
        });
        stream.on('end', () => end_cb());
        stream.read(chunk_size);
    }
}


